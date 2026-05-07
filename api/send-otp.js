export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const { phone } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const response = await fetch("https://api.startmessaging.com/otp/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.START_MSG_API_KEY,
      },
      body: JSON.stringify({
        phoneNumber: phone.startsWith("+91") ? phone : `+91${phone}`,
        variables: {
          otp: otp,
          appName: "S K Crackers",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ success: false, data });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
