
exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  };

  const respond = (statusCode, data) => ({
    statusCode,
    headers,
    body: JSON.stringify(data)
  });

  if (event.httpMethod !== 'POST') {
    return respond(405, {
      ok: false,
      message: 'Kaedah tidak dibenarkan.'
    });
  }

  const apiUrl = process.env.WARDEN_API_URL;
  const apiSecret = process.env.WARDEN_API_SECRET;

  if (!apiUrl || !apiSecret) {
    return respond(500, {
      ok: false,
      message: 'Konfigurasi backend belum lengkap.'
    });
  }

  try {
    const request = JSON.parse(event.body || '{}');

    const allowedActions = [
      'get',
      'verifyPin',
      'save',
      'saveActivity',
      'diagnoseSecret'
    ];

    if (!allowedActions.includes(request.action)) {
      return respond(400, {
        ok: false,
        message: 'Tindakan tidak sah.'
      });
    }

    const payload = {
      action: request.action,
      secret: apiSecret
    };

    // PIN diperlukan untuk pengesahan log masuk
    // dan untuk menyimpan perubahan.
    if (
      request.action === 'verifyPin' ||
      request.action === 'save' ||
      request.action === 'saveActivity'
    ) {
      if (
        typeof request.pin !== 'string' ||
        request.pin.trim() === ''
      ) {
        return respond(400, {
          ok: false,
          message: 'PIN pentadbir diperlukan.'
        });
      }

      payload.pin = request.pin.trim();
    }

    if (
      request.action === 'save' ||
      request.action === 'saveActivity'
    ) {
      if (!request.payload) {
        return respond(400, {
          ok: false,
          message: 'Maklumat simpanan tidak lengkap.'
        });
      }

      payload.payload = request.payload;
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
      throw new Error(
        'Backend Google Apps Script tidak dapat dicapai.'
      );
    }

    const result = await response.json();

    return respond(result.ok === false ? 400 : 200, result);

  } catch (error) {
    return respond(502, {
      ok: false,
      message: 'Sambungan backend gagal. Sila cuba lagi.'
    });
  }
};
