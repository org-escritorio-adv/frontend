import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

async function rodarTesteLogin() {
  console.log("Conectando ao Selenium no Docker...");
  
  let options = new chrome.Options();
  options.addArguments('--disable-gpu');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.windowSize({ width: 1280, height: 800 });

  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .usingServer('http://selenium-chrome:4444/wd/hub')
    .build();

  try {
    console.log("Iniciando o teste automatizado na Home...");
    await driver.get('http://frontend:3000');

    console.log("Aguardando o carregamento da Landing Page...");
    await driver.wait(until.elementLocated(By.tagName('body')), 15000);

    // =================================================================
    // Clicar em "Área do Advogado" para abrir o Login real
    // =================================================================
    console.log("Buscando e clicando no botão 'Área do Advogado'...");
    let seletorAreaAdvogado = By.xpath("//button[contains(text(), 'Área do Advogado')] | //a[contains(text(), 'Área do Advogado')]");
    let botaoAreaAdvogado = await driver.wait(until.elementLocated(seletorAreaAdvogado), 15000);
    await botaoAreaAdvogado.click();

    console.log("Aguardando redirecionamento para o formulário de Login...");
    // Aguarda 4 segundos para o Keycloak/Tela de Login renderizar
    await driver.sleep(4000);

    // ==========================================
    // 1 - ESPERAR E PREENCHER O E-MAIL (LOGIN REAL)
    // ==========================================
    console.log("Buscando o campo de e-mail de login na tela...");
    let seletorEmail = By.css('input[type="email"], input[name="email"]');
    let campoEmail = await driver.wait(until.elementLocated(seletorEmail), 15000);
    await driver.wait(until.elementIsVisible(campoEmail), 15000);
    
    console.log("Preenchendo o e-mail...");
    await campoEmail.clear();
    await campoEmail.sendKeys('admin@escritorio.com');

    // ==========================================
    // 2 - ESPERAR E PREENCHER A SENHA
    // ==========================================
    console.log("Buscando o campo de senha na tela...");
    let seletorSenha = By.css('input[type="password"], input[name="password"]');
    let campoSenha = await driver.wait(until.elementLocated(seletorSenha), 15000);
    await driver.wait(until.elementIsVisible(campoSenha), 15000);
    
    console.log("Preenchendo a senha...");
    await campoSenha.clear();
    await campoSenha.sendKeys('admin123');

    // ==========================================
    // 3 - ESPERAR E CLICAR NO BOTÃO ENTRAR
    // ==========================================
    console.log("Clicando no botão entrar...");
    let seletorBotao = By.xpath("//button[contains(text(), 'ENTRAR') or contains(text(), 'Entrar')]");
    let botaoEntrar = await driver.wait(until.elementLocated(seletorBotao), 10000);
    await botaoEntrar.click();

    await driver.sleep(3000);
    const logs = await driver.manage().logs().get('browser');
    logs.forEach(log => console.log('BROWSER LOG:', log.message));

    // 4 - Aguardar o tempo do redirecionamento para o dashboard
    console.log("Aguardando o redirecionamento para o Dashboard...");
    await driver.sleep(5000); 

    // 5 - Pegar a url atual para validar se o login funcionou
    let urlAtual = await driver.getCurrentUrl();
    console.log(`URL final encontrada: ${urlAtual}`);

    if (urlAtual.includes('/dashboard')) {
      console.log("\n==================================================");
      console.log("Sucesso: O robô conseguiu fazer o login e entrar no dashboard.");
      console.log("==================================================\n");
      
      console.log("Gerando evidências de sucesso...");
      const image = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-login.png', image, 'base64');
    } else {
      console.log("\n==================================================");
      console.log("Erro: O robô não foi redirecionado para a tela correta do dashboard.");
      console.log("==================================================\n");
      
      console.log("Gerando print do problema de redirecionamento...");
      const imageErroRedirecionamento = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-redirecionamento.png', imageErroRedirecionamento, 'base64');
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/evidencia-erro-redirecionamento.html', htmlErro);
    }

    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou catastroficamente:", erro);
    
    try {
      console.log("Gerando imagem do erro para análise visual...");
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-login.png', imagemErro, 'base64');

      console.log("Salvando o HTML do momento exato do erro para diagnóstico...");
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-pagina.html', htmlErro);
    } catch (erroHtml) {
      console.error("Não foi possível salvar as evidências de erro:", erroHtml);
    }
    
  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteLogin();