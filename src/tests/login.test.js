import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

async function rodarTesteLogin() {
  console.log("Conectando ao Selenium no Docker...");
  
  let options = new chrome.Options();
  // options.addArguments('--headless');
  options.addArguments('--disable-gpu');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.windowSize({ width: 1280, height: 800 });

  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .usingServer('http://localhost:4444/wd/hub')
    .build();

  try {
    console.log("Iniciando o teste automatizado...");
    await driver.get('http://frontend:3000');

    let urlDebug = await driver.getCurrentUrl();
    console.log("URL atual:", urlDebug);
    let statusHtml = await driver.getPageSource();
    console.log("Primeiros 500 chars:", statusHtml.substring(0, 500));

    console.log("Aguardando carregamento inicial do corpo da página...");
    await driver.wait(until.elementLocated(By.tagName('body')), 15000);

    // Dando um tempo maior para o React buildar os componentes na tela do Docker
    console.log("Aguardando 8 segundos para o React renderizar os componentes...");
    await driver.sleep(8000);
    
    let title = await driver.getTitle();
    console.log(`Título da página capturado: "${title}"`);

    // 1 - esperar o campo de e-mail aparecer na tela com timeout maior
    console.log("Buscando o campo de e-mail na tela...");
    let seletorEmail = By.css('input[type="email"]');
    await driver.wait(until.elementLocated(seletorEmail), 10000);
    let campoEmail = await driver.findElement(seletorEmail);
    await campoEmail.sendKeys('advogado@barcelostakaki.com.br');

    // 2 - localizar o campo de senha e preencher o valor
    console.log("Preenchendo o campo de senha...");
    let campoSenha = await driver.findElement(By.css('input[type="password"]'));
    await campoSenha.sendKeys('SenhaSegura123');

    // 3 - localizar o botão entrar e clicar nele
    console.log("Clicando no botão entrar...");
    let botaoEntrar = await driver.findElement(By.xpath("//button[contains(text(), 'ENTRAR')]"));
    await botaoEntrar.click();

    // 4 - aguardar o tempo do redirecionamento para o dashboard
    console.log("Aguardando o redirecionamento...");
    await driver.sleep(3000); 

    // 5 - pegar a url atual para validar se o login funcionou
    let urlAtual = await driver.getCurrentUrl();
    console.log(`URL final encontrada: ${urlAtual}`);

    if (urlAtual.includes('/dashboard')) {
      console.log("\n==================================================");
      console.log("Sucesso: O robô conseguiu fazer o login e entrar no dashboard.");
      console.log("==================================================\n");
    } else {
      console.log("\n==================================================");
      console.log("Erro: O robô não foi redirecionado para a tela correta.");
      console.log("==================================================\n");
    }

    console.log("Gerando evidências de sucesso...");
    const image = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-login.png', image, 'base64');

    console.log("Teste finalizado com sucesso!");

  } catch (erro) {
    console.error("O teste falhou:", erro);
    
    try {
      console.log("Salvando o HTML do momento exato do erro para diagnóstico...");
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-pagina.html', htmlErro);
    } catch (erroHtml) {
      console.error("Não foi possível salvar o HTML de erro:", erroHtml);
    }
    
  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteLogin();