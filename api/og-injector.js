export default async function handler(req, res) {
  const { taskid } = req.query;
  const API_URL = process.env.VITE_API_URL || 'http://localhost:8000';
  
  try {
    // 현재 요청을 받은 호스트 정보를 바탕으로 배포된 원본 index.html을 가져옵니다.
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'metheyou.pdj.kr';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    const baseHtmlRes = await fetch(`${protocol}://${host}/index.html`);
    if (!baseHtmlRes.ok) {
      return res.status(200).send('결과 페이지를 불러올 수 없습니다.');
    }
    
    let html = await baseHtmlRes.text();

    if (taskid) {
      // 백엔드 API에서 분석 결과(공유할 내용) 데이터를 가져옵니다.
      const apiRes = await fetch(`${API_URL}/analysis_info?tid=${taskid}`);
      
      if (apiRes.ok) {
        const data = await apiRes.json();
        
        if (data && data.video_id && data.video_id !== -1 && String(data.video_id).trim() !== '-1') {
          // OG 메타태그에 들어갈 값을 조립합니다.
          const title = data.title || '분석 결과';
          const score = data.score;
          
          let safetyTitle = '유해한 영상입니다';
          if (score >= 70) safetyTitle = '안전한 영상입니다';
          else if (score >= 40) safetyTitle = '주의가 필요한 영상입니다';
          
          const channel = data.channel_name ? ` / ${data.channel_name}` : '';
          const description = `판정결과: ${safetyTitle} (안전도 ${score}점)${channel}`;
          const imageUrl = `https://i.ytimg.com/vi/${data.video_id}/hq720.jpg`;
          
          // 원본 index.html의 메타 태그를 동적으로 교체(치환)합니다.
          html = html.replace(
            /<meta property="og:title" content="[^"]*"\s*\/?>/i, 
            `<meta property="og:title" content="믿어유 - ${title}" />`
          );
          html = html.replace(
            /<meta property="og:description" content="[^"]*"\s*\/?>/i, 
            `<meta property="og:description" content="${description}" />`
          );
          html = html.replace(
            /<meta property="og:image" content="[^"]*"\s*\/?>/i, 
            `<meta property="og:image" content="${imageUrl}" />`
          );
        }
      }
    }
    
    // 치환된 완전한 HTML을 반환합니다. (일반 사용자는 스크립트가 실행되어 정상적으로 React 앱 렌더링, 봇은 OG 태그를 읽어감)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    console.error('OG Injector Error:', error);
    // 문제가 생기더라도 React 라우터가 처리할 수 있도록 Fallback용 HTML을 제공하거나 그대로 보냅니다.
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send('<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>믿어유</title><script>window.location.href="/";</script></head><body>Redirecting...</body></html>');
  }
}
