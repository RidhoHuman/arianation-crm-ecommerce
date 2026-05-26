const https = require('https');

const token = process.env.VERCEL_TOKEN;
const teamId = process.env.VERCEL_TEAM_ID;
const projectId = process.env.VERCEL_PROJECT_ID;
const databaseUrl = process.env.DATABASE_URL;

if (!token || !teamId || !projectId || !databaseUrl) {
  throw new Error(
    'Missing required environment variables: VERCEL_TOKEN, VERCEL_TEAM_ID, VERCEL_PROJECT_ID, DATABASE_URL'
  );
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function main() {
  try {
    console.log('Mengambil environment variables yang ada...');
    const getRes = await makeRequest('GET', `/v9/projects/${projectId}/env?teamId=${teamId}`);
    
    let configId = null;
    if (getRes.data.envs) {
      const existing = getRes.data.envs.find(e => e.key === 'DATABASE_URL' && e.target.includes('production'));
      if (existing) {
        configId = existing.id;
        console.log('Ditemukan DATABASE_URL yang sudah ada:', configId);
      }
    }
    
    // Hapus jika sudah ada
    if (configId) {
      console.log('Menghapus DATABASE_URL lama...');
      const delRes = await makeRequest('DELETE', `/v9/projects/${projectId}/env/${configId}?teamId=${teamId}`);
      console.log('Status penghapusan:', delRes.status);
    }
    
    // Tambah yang baru dari Neon
    console.log('Menambahkan DATABASE_URL baru (Neon)...');
    const addRes = await makeRequest('POST', `/v9/projects/${projectId}/env?teamId=${teamId}`, {
      key: 'DATABASE_URL',
      value: databaseUrl,
      type: 'encrypted',
      target: ['production']
    });
    
    console.log('Status:', addRes.status);
    
    if (addRes.status >= 200 && addRes.status < 300) {
      console.log('\n✅ DATABASE_URL berhasil diubah ke Neon!');
    } else {
      console.log('\n❌ Gagal mengubah DATABASE_URL');
      console.log('Response:', JSON.stringify(addRes.data, null, 2));
    }
  } catch (err) {
    console.error('❌ Kesalahan:', err.message);
  }
}

main();
