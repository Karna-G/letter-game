// Raw TLS + MongoDB wire protocol test
const tls = require('tls');

const host = 'ac-uvktxid-shard-00-00.seznlfo.mongodb.net';
const port = 27017;

console.log(`Testing TLS handshake to ${host}:${port}...`);

const socket = tls.connect(port, host, { servername: host }, () => {
  console.log('TLS handshake SUCCESS!');
  console.log('Protocol:', socket.getProtocol());
  console.log('Cipher:', JSON.stringify(socket.getCipher()));
  console.log('Authorized:', socket.authorized);
  console.log('Server certificate CN:', socket.getPeerCertificate().subject?.CN);
  socket.destroy();
  process.exit(0);
});

socket.on('error', (err) => {
  console.error('TLS ERROR:', err.message);
  console.error('Full error:', err);
  process.exit(1);
});

setTimeout(() => {
  console.error('TIMEOUT: TLS handshake took too long');
  process.exit(1);
}, 10000);
