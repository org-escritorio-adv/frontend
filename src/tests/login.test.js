import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js'; // 1. ADICIONE ESSA LINHA AQUI EM CIMA
import fs from 'fs';

async function rodarTesteLogin() {
  console.log("Conectando ao Selenium no Docker");
  
  // 2. ADICIONE ESSAS OPÇÕES DO CHROME AQUI:
  let options = new chrome.Options();
  options.addArguments('--headless'); // Roda em segundo plano
  options.addArguments('--disable-gpu'); // 🔥 ISSO MATA O BUG DA TELA BRANCA
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.windowSize({ width: 1280, height: 800 }); // Garante um tamanho bom para o print

  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options) // 3. ADICIONE ESSA LINHA AQUI
    .usingServer('http://localhost:4444/wd/hub')
    .build();

  try {
    console.log("Iniciando o teste automatizado");
    
    await driver.get('http://frontend:3000');

    console.log("Aguardando carregamento da página");
    await driver.wait(until.elementLocated(By.tagName('body')), 10000);

    // espera 3 segundos para a página carregar o React
    await driver.sleep(3000);
    
    let title = await driver.getTitle();
    console.log(`Título da página capturado: "${title}"`);

    console.log("Print da tela");
    const image = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-login.png', image, 'base64');
    console.log("Print da tela salvo em src/tests/evidencia-login.png.");

    const html = await driver.getPageSource();
    fs.writeFileSync('src/tests/conteudo-pagina.html', html);
    console.log("HTML da página salvo em src/tests/conteudo-pagina.html");

    console.log("Teste finalizado com sucesso!");

  } catch (erro) {
    console.error("O teste falhou:", erro);
  } finally {
    await driver.quit();
  }
}

rodarTesteLogin();