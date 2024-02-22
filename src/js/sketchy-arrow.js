const DEFAULT_OPTIONS = {
  randomSeed: { value: null },
  tipSpread: { value: Math.PI / 4, unit: 'rad' },
  tipSize: { value: 3 },
  width: { value: 1, unit: 'px' },
  pointApprox: { value: 3 },
  count: { value: 3 },
  color: 'black'
};
const PROPS = Object.keys(DEFAULT_OPTIONS).map(
  key => `--sketchy-arrow-${key.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}`
);

function* pseudoRandom(seed) {
  let state = seed;

  while (true) {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let temp = Math.imul(state ^ (state >>> 15), 1 | state);
    temp = (temp + Math.imul(temp ^ (temp >>> 7), 61 | temp)) ^ temp;
    yield ((temp ^ (temp >>> 14)) >>> 0) / 4294967296; // = 2 ** 32
  }
}

function getOptionObject(props) {
  const map = {};
  PROPS.forEach(key => {
    map[propToOption(key)] = props.get(key);
  });
  return map;
}

function propToOption(name) {
  return name.replace(/^--sketchy-arrow-/, '').replace(/-[a-z]/g, m => m[1].toUpperCase());
}

registerPaint('sketchy-arrow', class {
  static get inputProperties() {
    return PROPS;
  }

  paint(ctx, geometry, props) {
    Object.assign(this, DEFAULT_OPTIONS, getOptionObject(props));
    this.widthInPixels = this.width.unit === 'px' ? this.width : this.width.to('px');
    this.tipSpreadInRadians = this.tipSpread.unit === 'rad' ? this.tipSpread : this.tipSpread.to('rad');
    this.variance = this.widthInPixels.value * this.pointApprox.value;
    this.prng = pseudoRandom(this.randomSeed.value || (Math.random() * Number.MAX_SAFE_INTEGER | 0));

    for (let i = 0; i < this.count.value; i++) {
      this.drawArrow(ctx, geometry);
    }
  }

  approxPoint(x, y) {
    const dist = this.prng.next().value * this.variance;
    const angle = this.prng.next().value * Math.PI * 2;
    return [x + dist * Math.cos(angle), y + dist * Math.sin(angle)];
  }

  drawArrow(ctx, geometry) {
    const [startX, startY] = this.approxPoint(this.variance, this.variance);
    const [endX, endY] = this.approxPoint(
      geometry.width - this.variance,
      geometry.height - this.variance
    );

    const rw = endX - startX;
    const rh = endY - startY;

    const cosine = (rw ** 2 - rh ** 2) / 2 / rh;
    const endAngle = Math.atan(rw / cosine);

    const tipDistance = this.widthInPixels.value * this.tipSize.value;
    const tipLeftCornerAngle = endAngle + this.tipSpreadInRadians.value / 2 - Math.PI;
    const tipRightCornerAngle = endAngle - this.tipSpreadInRadians.value / 2 - Math.PI;
    const tipLeftCornerX = endX + tipDistance * Math.cos(tipLeftCornerAngle);
    const tipLeftCornerY = endY + tipDistance * Math.sin(tipLeftCornerAngle);
    const tipRightCornerX = endX + tipDistance * Math.cos(tipRightCornerAngle);
    const tipRightCornerY = endY + tipDistance * Math.sin(tipRightCornerAngle);

    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.widthInPixels.value;
    ctx.arc(
      startX,
      rh + cosine + startY,
      rh + cosine,
      -Math.PI / 2,
      endAngle - Math.PI / 2
    );
    ctx.lineTo(...this.approxPoint(tipLeftCornerX, tipLeftCornerY));
    ctx.moveTo(endX, endY);
    ctx.lineTo(...this.approxPoint(tipRightCornerX, tipRightCornerY));
    ctx.stroke();
    ctx.closePath();
  }
});
