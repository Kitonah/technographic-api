import { connect } from 'cloudflare:sockets';
import { X509Certificate } from '@peculiar/x509';
import { TlsProbeData } from '../types/contracts';

/**
 * Builds a RFC 5246 & RFC 6066 compliant TLS 1.2 ClientHello with SNI.
 * Offering TLS 1.2 forces servers to deliver the X.509 certificate chain
 * in cleartext during the handshake prior to encryption.
 */
function buildClientHello(domain: string): Uint8Array {
  const encoder = new TextEncoder();
  const hostnameBytes = encoder.encode(domain);
  const hostnameLen = hostnameBytes.length;

  // 1. SNI Extension (Type 0x0000)
  const serverNameListLen = 1 + 2 + hostnameLen;
  const sniExtDataLen = 2 + serverNameListLen;
  const sniExt = new Uint8Array(4 + sniExtDataLen);
  sniExt[0] = 0x00; sniExt[1] = 0x00; // Type: server_name
  sniExt[2] = (sniExtDataLen >> 8) & 0xff;
  sniExt[3] = sniExtDataLen & 0xff;
  sniExt[4] = (serverNameListLen >> 8) & 0xff;
  sniExt[5] = serverNameListLen & 0xff;
  sniExt[6] = 0x00; // name_type: host_name
  sniExt[7] = (hostnameLen >> 8) & 0xff;
  sniExt[8] = hostnameLen & 0xff;
  sniExt.set(hostnameBytes, 9);

  // 2. Supported Groups Extension (Type 0x000a: X25519, secp256r1, secp384r1)
  const groupsExt = new Uint8Array([
    0x00, 0x0a, 0x00, 0x08, 0x00, 0x06,
    0x00, 0x1d, 0x00, 0x17, 0x00, 0x18
  ]);

  // 3. EC Point Formats Extension (Type 0x000b)
  const ecPointExt = new Uint8Array([0x00, 0x0b, 0x00, 0x02, 0x01, 0x00]);

  // 4. Signature Algorithms Extension (Type 0x000d)
  const sigAlgExt = new Uint8Array([
    0x00, 0x0d, 0x00, 0x0a, 0x00, 0x08,
    0x04, 0x03, 0x04, 0x01, 0x05, 0x01, 0x06, 0x01
  ]);

  // Pack extensions block
  const extensionsLen = sniExt.length + groupsExt.length + ecPointExt.length + sigAlgExt.length;
  const extensions = new Uint8Array(2 + extensionsLen);
  extensions[0] = (extensionsLen >> 8) & 0xff;
  extensions[1] = extensionsLen & 0xff;
  let offset = 2;
  extensions.set(sniExt, offset); offset += sniExt.length;
  extensions.set(groupsExt, offset); offset += groupsExt.length;
  extensions.set(ecPointExt, offset); offset += ecPointExt.length;
  extensions.set(sigAlgExt, offset);

  // Standard Cipher Suites (ECDHE-RSA/ECDSA + AES-GCM / CHACHA20)
  const cipherSuites = new Uint8Array([
    0x00, 0x0c,
    0xc0, 0x2f, 0xc0, 0x30, 0xc0, 0x2b, 0xc0, 0x2c, 0xcc, 0xa8, 0xcc, 0xa9
  ]);

  // 32-byte Client Random
  const clientRandom = new Uint8Array(32);
  crypto.getRandomValues(clientRandom);

  // Body: Version(2) + Random(32) + SessionID(1) + Ciphers(14) + Compression(2) + Extensions
  const bodyLen = 2 + 32 + 1 + cipherSuites.length + 2 + extensions.length;
  const body = new Uint8Array(bodyLen);
  let bOffset = 0;
  body[bOffset++] = 0x03; body[bOffset++] = 0x03; // TLS 1.2
  body.set(clientRandom, bOffset); bOffset += 32;
  body[bOffset++] = 0x00; // Session ID length: 0
  body.set(cipherSuites, bOffset); bOffset += cipherSuites.length;
  body[bOffset++] = 0x01; body[bOffset++] = 0x00; // Compression: null
  body.set(extensions, bOffset);

  // Handshake Header (Type 0x01 = ClientHello)
  const handshake = new Uint8Array(4 + bodyLen);
  handshake[0] = 0x01;
  handshake[1] = (bodyLen >> 16) & 0xff;
  handshake[2] = (bodyLen >> 8) & 0xff;
  handshake[3] = bodyLen & 0xff;
  handshake.set(body, 4);

  // TLS Record Header (Type 0x16 = Handshake, Version 3.1)
  const recordLen = handshake.length;
  const record = new Uint8Array(5 + recordLen);
  record[0] = 0x16;
  record[1] = 0x03; record[2] = 0x01;
  record[3] = (recordLen >> 8) & 0xff;
  record[4] = recordLen & 0xff;
  record.set(handshake, 5);

  return record;
}

/**
 * Scans raw stream buffers for the Certificate handshake record (Type 0x0b)
 * and isolates the leaf X.509 DER payload.
 */
function parseCertificateFromBuffer(buf: Uint8Array): Uint8Array | null {
  let offset = 0;
  while (offset + 5 <= buf.length) {
    if (buf[offset] !== 0x16) return null; // Non-handshake record encountered

    const recordLen = (buf[offset + 3] << 8) | buf[offset + 4];
    const recordEnd = offset + 5 + recordLen;
    if (buf.length < recordEnd) return null; // Partial record; wait for remaining bytes

    let hsOffset = offset + 5;
    while (hsOffset + 4 <= recordEnd) {
      const hsType = buf[hsOffset];
      const hsLen = (buf[hsOffset + 1] << 16) | (buf[hsOffset + 2] << 8) | buf[hsOffset + 3];
      const hsBodyStart = hsOffset + 4;
      const hsBodyEnd = hsBodyStart + hsLen;

      if (recordEnd < hsBodyEnd) break;

      if (hsType === 0x0b) { // Handshake Type 11: Certificate
        if (hsBodyStart + 6 <= recordEnd) {
          const leafCertLen = (buf[hsBodyStart + 3] << 16) | (buf[hsBodyStart + 4] << 8) | buf[hsBodyStart + 5];
          const leafStart = hsBodyStart + 6;
          const leafEnd = leafStart + leafCertLen;

          if (leafEnd <= recordEnd) {
            return buf.subarray(leafStart, leafEnd);
          }
        }
      }
      hsOffset = hsBodyEnd;
    }
    offset = recordEnd;
  }
  return null;
}

/**
 * Parses dNSName entries from the Subject Alternative Name extension
 * (ASN.1 DER tag 0x82 under OID 2.5.29.17).
 */
function extractSanList(der: Uint8Array): string[] {
  const sans: string[] = [];
  const sanOid = [0x55, 0x1d, 0x11]; // 2.5.29.17 in DER
  let pos = -1;

  for (let i = 0; i < der.length - 3; i++) {
    if (der[i] === sanOid[0] && der[i + 1] === sanOid[1] && der[i + 2] === sanOid[2]) {
      pos = i + 3;
      break;
    }
  }

  if (pos === -1) return [];

  const limit = Math.min(der.length, pos + 4096);
  let i = pos;
  while (i < limit - 2) {
    if (der[i] === 0x82) { // Context-specific [2] dNSName tag
      const len = der[i + 1];
      if (len > 0 && len < 253 && i + 2 + len <= der.length) {
        const nameBytes = der.subarray(i + 2, i + 2 + len);
        const str = new TextDecoder().decode(nameBytes);
        if (/^[a-zA-Z0-9*.-]+$/.test(str) && str.includes('.')) {
          if (!sans.includes(str)) sans.push(str);
        }
        i += 2 + len;
        continue;
      }
    }
    i++;
  }
  return sans;
}

/**
 * Probe 2: TLS Socket Analyzer
 * Connects to port 443 over raw TCP, captures the leaf certificate,
 * and extracts the CA Issuer and SAN inventory.
 */
export async function runTlsProbe(domain: string): Promise<TlsProbeData> {
  const fallback: TlsProbeData = {
    issuer: 'Unknown',
    sanList: [domain],
    protocol: 'TLSv1.2'
  };

  try {
    const socket = connect({ hostname: domain, port: 443 });

    // Hard 3-second timeout protection for raw socket execution
    const probe = (async () => {
      const writer = socket.writable.getWriter();
      await writer.write(buildClientHello(domain));
      writer.releaseLock();

      const reader = socket.readable.getReader();
      let buffer = new Uint8Array(0);

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done || !value) break;

          const merged = new Uint8Array(buffer.length + value.length);
          merged.set(buffer);
          merged.set(value, buffer.length);
          buffer = merged;

          const leafCertDer = parseCertificateFromBuffer(buffer);
          if (leafCertDer) {
            const cert = new X509Certificate(leafCertDer);
            const sans = extractSanList(leafCertDer);

            return {
              issuer: cert.issuer,
              sanList: sans.length > 0 ? sans : [domain],
              validTo: cert.notAfter.toISOString(),
              protocol: 'TLSv1.2'
            };
          }

          if (buffer.length > 32768) break; // Exceeded handshake inspection budget
        }
      } finally {
        reader.releaseLock();
        socket.close();
      }
      return fallback;
    })();

    const timeout = new Promise<TlsProbeData>((resolve) =>
      setTimeout(() => {
        try { socket.close(); } catch {}
        resolve(fallback);
      }, 3000)
    );

    return await Promise.race([probe, timeout]);
  } catch {
    return fallback;
  }
}