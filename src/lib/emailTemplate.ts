export const quietHoursTemplate = (startTime: string, endTime: string) => `
  <div style="font-family: sans-serif; line-height: 1.4;">
    <h2>Quiet Hours Alert</h2>
    <p>Your quiet hours are scheduled soon in 10 mins.</p>
    <p><strong>Start:</strong> ${startTime}</p>
    <p><strong>End:</strong> ${endTime}</p>
  </div>
`;
