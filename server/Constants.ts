export class Timestamp {
  public static toISOLocal(dt): string {
    let tzo = dt.getTimezoneOffset();
    var pad = function (n) {
      var t = Math.floor(Math.abs(n));
      return (t < 10 ? '0' : '') + t;
    };
    return new Date(dt.getTime() - (tzo * 60000)).toISOString().slice(0, -1) + (tzo > 0 ? '-' : '+') + pad(tzo / 60) + pad(tzo % 60)
  }
}