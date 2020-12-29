function setTimeDateFmt(s: number) {
  return s < 10 ? '0' + s : s.toString();
}

export const trackingNumberGenerator = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const monthString = setTimeDateFmt(month);
  const dayString = setTimeDateFmt(day);
  const hourString = setTimeDateFmt(hour);
  const minutesString = setTimeDateFmt(minutes);
  const secondsString = setTimeDateFmt(seconds);

  const trackingNumber =
    now.getFullYear().toString() +
    monthString +
    dayString +
    hourString +
    minutesString +
    secondsString +
    Math.round(Math.random() * 1000000).toString();

  return trackingNumber;
};
