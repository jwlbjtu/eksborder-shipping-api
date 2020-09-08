function setTimeDateFmt(s: number) {
  return s < 10 ? '0' + s : s.toString();
}
  
export const trackingNumberGenerator = () => {
    const now = new Date()
    let month = now.getMonth() + 1
    let day = now.getDate()
    let hour = now.getHours()
    let minutes = now.getMinutes()
    let seconds = now.getSeconds()
    let monthString = setTimeDateFmt(month)
    let dayString = setTimeDateFmt(day)
    let hourString = setTimeDateFmt(hour)
    let minutesString = setTimeDateFmt(minutes)
    let secondsString = setTimeDateFmt(seconds)

    let trackingNumber = now.getFullYear().toString() + 
      monthString + 
      dayString + 
      hourString + 
      minutesString + 
      secondsString + 
      (Math.round(Math.random() * 1000000)).toString();

    return trackingNumber;
}