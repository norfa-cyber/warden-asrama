
exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  };

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        message: 'Kaedah tidak dibenarkan.'
      })
    };
  }

  const apiUrl = process.env.WARDEN_API_URL;
  const apiSecret = process.env.WARDEN_API_SECRET;

  if (!apiUrl || !apiSecret) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Konfigurasi backend belum lengkap.'
      })
    };
  }

  try {
    const request = JSON.parse(event.body || '{}');

    if (!['get', 'save'].includes(request.action)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Tindakan tidak sah.'
        })
      };
    }

    const payload = {
      action: request.action,
      secret: apiSecret
    };

    if (request.action === 'save') {
      if (!request.payload || !request.pin) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            message: 'Maklumat simpanan tidak lengkap.'
          })
        };
      }

      payload.payload = request.payload;
      payload.pin = request.pin;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error('Backend Google Apps Script tidak dapat dicapai.');
    }

    const result = await response.json();

    return {
      statusCode: result.ok === false ? 400 : 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        message: 'Sambungan backend gagal. Sila cuba lagi.'
      })
    };
  }
};

