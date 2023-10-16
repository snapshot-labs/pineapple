export default {
  contentType: 'application/json',
  content: Buffer.from(JSON.stringify({ status: 'OK' })),
  alternateContent: Buffer.from(JSON.stringify({ status: 'CACHED' })),
  cid: 'bafkreib5epjzumf3omr7rth5mtcsz4ugcoh3ut4d46hx5xhwm4b3pqr2vi'
};
