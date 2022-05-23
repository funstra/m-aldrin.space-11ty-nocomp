module.exports.irand = ([a, b]) => a + Math.floor(Math.random() * (1 + b - a));
module.exports.frand = ([a, b]) => a + Math.random() * (b - a);
module.exports.angleToV = ([a, m]) => [
  m * Math.cos((a / 180) * Math.PI),
  m * Math.sin((a / 180) * Math.PI),
];
