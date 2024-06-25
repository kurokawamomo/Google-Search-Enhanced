(async () => {
    const GEMINI_API_KEY = 'PASTE YOUR GOOGLE GENERATIVE LANGUAGE API KEY HERE';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`;
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // ########## Results ##########
    const processArticle = async (article, title, url) => {
        try {
            document.querySelector('#gemini-ticker').style.opacity = '1';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `URLに対し、次の手順に従ってステップバイステップで実行してください。
                            1 URLにアクセス出来なかった場合、結果を出力しない
                            2 300字程度に学者のように具体的に要約
                            3 結果のみを出力
                            ${title}のURL: ${url}`
                        }],
                    }]
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const reader = response.body.getReader();
            let result = '', done = false, decoder = new TextDecoder();
            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                if (value) result += decoder.decode(value, { stream: true });
            }
            result += decoder.decode();

            const data = JSON.parse(result);
            let summary = (data.candidates[0]?.content?.parts[0]?.text || '').replace(/\*\*/g, '').replace(/##/g, '');
            console.log(`summary: ${summary}`);

            let targetElement = article.parentElement.parentElement.parentElement.parentElement
                .nextSibling?.querySelectorAll('div>span')[1] || 
                article.parentElement.parentElement.parentElement.parentElement
                .nextSibling?.querySelectorAll('div>span')[0];
            if (!targetElement) return;
            targetElement.parentElement.setAttribute('style', '-webkit-line-clamp: 30');
            article.classList.add('gemini-annotated');

            let displayText = '✦ ';
            for (const char of summary) {
                document.querySelector('#gemini-ticker').style.opacity = '1';
                displayText += char + '●';
                targetElement.textContent = displayText;
                await delay(2);
                displayText = displayText.slice(0, -1);
                document.querySelector('#gemini-ticker').style.opacity = '0';
            }
            targetElement.textContent = displayText;
        } catch (error) {
            await delay(5000);
            console.error('Error:', error);
        }
    };

    // ########## Ticker ##########
    const insertTickerElement = () => {
        const ticker = document.createElement('div');
        ticker.id = 'gemini-ticker';
        ticker.style.position = 'fixed';
        ticker.style.right = '20px';
        ticker.style.bottom = '10px';
        ticker.style.fontSize = '1.5em';
        ticker.style.color = '#77777777';
        ticker.style.transition = 'opacity .3s';
        ticker.style.zIndex = '100';
        ticker.innerHTML = '✦';
        document.querySelector('body').appendChild(ticker);
    };

    // ########## Main ##########
    await delay(1000);
    insertTickerElement();
    for (let j = 0; j < 30 ; j++) {
        console.log(`######## attempt: ${j+1} ########`)
        const articles = Array.from(document.querySelectorAll('#rso>div'))
                .map(result=>result.querySelector('span>a:not(.gemini-annotated)'));
        if (articles.length == 0) break;

        for (const targetLink of articles) {
            if (!targetLink) continue;
            const href = targetLink.getAttribute('href');
            const title = targetLink.querySelector('h3').textContent;
            console.log(`title: ${title}`);
            console.log(`url: ${href}`);
            if (!href) continue;

            await processArticle(targetLink, title, href);
        }

        document.querySelector('#gemini-ticker').style.opacity = '0';
    }
    document.querySelector('#gemini-ticker').style.opacity = '0';
})();
