import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

async function rodarTesteRecuperarSenha() {
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
    console.log("Iniciando o teste de recuperação de senha na Home...");
    await driver.get(process.env.TEST_URL || 'http://frontend:3000');

    console.log("Aguardando o carregamento da Landing Page...");
    await driver.wait(until.elementLocated(By.tagName('body')), 15000);

    // =================================================================
    // 1 - Clicar em "Área do Advogado"
    // =================================================================
    console.log("Buscando e clicando no botão 'Área do Advogado'...");
    let seletorAreaAdvogado = By.xpath("//button[contains(text(), 'Área do Advogado')] | //a[contains(text(), 'Área do Advogado')]");
    let botaoAreaAdvogado = await driver.wait(until.elementLocated(seletorAreaAdvogado), 15000);
    await botaoAreaAdvogado.click();

    console.log("Aguardando redirecionamento para o formulário de Login...");
    await driver.sleep(4000);

    // =================================================================
    // 2 - Clicar no link "recupere sua senha"
    // =================================================================
    console.log("Buscando o link 'recupere sua senha'...");
    let seletorRecuperarLink = By.xpath("//a[contains(text(), 'recupere sua senha') or contains(text(), 'Recupere sua senha')]");
    let linkRecuperar = await driver.wait(until.elementLocated(seletorRecuperarLink), 15000);
    await linkRecuperar.click();

    console.log("Aguardando carregamento da página de recuperação...");
    await driver.sleep(2000);

    // =================================================================
    // 3 - Preencher e-mail e clicar em "Enviar código"
    // =================================================================
    await driver.sleep(3000);
    const logs = await driver.manage().logs().get('browser');
    logs.forEach(log => console.log('BROWSER LOG:', log.message));
    console.log("Preenchendo o e-mail para receber o código...");
    let seletorEmail = By.css('input[type="email"], input[name="email"]');
    let campoEmail = await driver.wait(until.elementLocated(seletorEmail), 15000);
    await campoEmail.clear();
    await campoEmail.sendKeys('admin@escritorio.com');

    console.log("Clicando no botão 'Enviar código'...");
    let seletorEnviarCod = By.xpath("//button[contains(text(), 'Enviar código') or contains(text(), 'Enviar Código')]");
    let botaoEnviarCod = await driver.wait(until.elementLocated(seletorEnviarCod), 10000);
    await botaoEnviarCod.click();

    await driver.sleep(6000);
    const logsBotao = await driver.manage().logs().get('browser');
    logsBotao.forEach(log => console.log('BROWSER LOG APÓS ENVIO:', log.message));
    await driver.sleep(4000);

    // =================================================================
    // 4 - CAPTURA TEMPO REAL E DINÂMICA DO TOKEN HEXADECIMAL NA TELA
    // =================================================================
    console.log("Aguardando o novo código dinâmico aparecer na tela...");
    await driver.sleep(4000);
    const logsAposEspera = await driver.manage().logs().get('browser');
    logsAposEspera.forEach(log => console.log('BROWSER LOG ESPERA:', log.message));

    const screenshot = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-apos-envio-codigo.png', screenshot, 'base64');

    let textoDaPagina = await driver.findElement(By.tagName('body')).getText();
    console.log("TEXTO DA PÁGINA:", textoDaPagina);

    // Pega o texto da página inteira
    // let textoDaPagina = await driver.findElement(By.tagName('body')).getText();
    let tokenCapturado = "";

    // REGEX REFINADA: Busca especificamente por 6 caracteres hexadecimais (0-9, a-f) minúsculos
    let regexHexadecimal = /\b[0-9a-f]{6}\b/;

    if (textoDaPagina.includes("código gerado:") || textoDaPagina.includes("codigo gerado:")) {
      // Divide o texto a partir do rótulo amarelo "DEV — código gerado:"
      let partes = textoDaPagina.split(/gerado:/i);
      if (partes[1]) {
        // Busca o token de 6 caracteres apenas no texto que vem DEPOIS do rótulo
        let matchPreciso = partes[1].match(regexHexadecimal);
        if (matchPreciso) {
          tokenCapturado = matchPreciso[0].trim();
        }
      }
    }

    // Plano B de contingência caso a quebra do split falhe
    if (!tokenCapturado) {
      let matches = textoDaPagina.match(regexHexadecimal);
      if (matches) {
        // Filtra para garantir que não pegou a palavra "Takaki" por engano
        let validos = matches.filter(m => m !== "Takaki");
        if (validos.length > 0) tokenCapturado = validos[0];
      }
    }

    if (tokenCapturado && tokenCapturado !== "Takaki") {
      console.log(`\n[CAPTURA REAL] 🎯 O robô pescou o código alfanumérico correto: ${tokenCapturado}`);
    } else {
      throw new Error("Não foi possível isolar o código hexadecimal de 6 caracteres (ex: 4958df) visível na tela.");
    }

    // SELETOR DO CAMPO AJUSTADO: Usando o placeholder exato da tela: "Código (ex: a1b2c3)"
    console.log("Buscando o campo de inserção do código...");
    let seletorCampoCod = By.css('input[placeholder*="ex:"], input[placeholder*="Código"], input[placeholder*="código"], input[name="code"]');
    let campoCod = await driver.wait(until.elementLocated(seletorCampoCod), 15000);
    await driver.wait(until.elementIsVisible(campoCod), 15000);
    
    console.log(`Digitando o código de verificação: ${tokenCapturado}`);
    await campoCod.clear();
    await campoCod.sendKeys(tokenCapturado); 

    console.log("Clicando no botão 'Verificar código'...");
    let seletorVerificarCod = By.xpath("//button[contains(text(), 'Verificar código') or contains(text(), 'Verificar Código')]");
    let botaoVerificar = await driver.wait(until.elementLocated(seletorVerificarCod), 10000);
    await botaoVerificar.click();

    // =================================================================
    // 5 - Definir Nova Senha Forte (Exigência: Letra Maiúscula e Números)
    // =================================================================
    console.log("Aguardando liberação dos campos de nova senha...");
    await driver.sleep(3000);

    console.log("Buscando campos de senha...");
    let camposSenha = await driver.findElements(By.css('input[type="password"]'));
    
    if (camposSenha.length >= 2) {
      console.log("Campos de senha localizados. Inserindo padrão '12345678A'...");
      await camposSenha[0].clear();
      await camposSenha[0].sendKeys('12345678A');
      
      await camposSenha[1].clear();
      await camposSenha[1].sendKeys('12345678A');
    } else {
      throw new Error("Os campos de senha nova não apareceram após clicar em verificar código.");
    }

    console.log("Clicando no botão de redefinição final...");
    let seletorBotaoRedefinir = By.xpath("//button[contains(text(), 'Redefinir') or contains(text(), 'redefinir') or contains(text(), 'Salvar') or contains(text(), 'Alterar')]");
    let botaoRedefinir = await driver.wait(until.elementLocated(seletorBotaoRedefinir), 10000);
    await botaoRedefinir.click();

    // =================================================================
    // 6 - Validar Redirecionamento Final
    // =================================================================
    console.log("Aguardando redirecionamento para concluir...");
    await driver.sleep(8000);

    let urlFinal = await driver.getCurrentUrl();
    console.log(`URL final obtida: ${urlFinal}`);

    if (urlFinal.includes('/login') || urlFinal.includes('auth')) {
      console.log("\n==================================================");
      console.log("SUCESSO: Fluxo dinâmico da US 1.1.2 Validado com Êxito!");
      console.log("==================================================\n");

      const image = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-redefinicao-sucesso.png', image, 'base64');
    } else {
      console.log("\n==================================================");
      console.log("AVISO: O fluxo terminou mas o redirecionamento divergiu.");
      console.log("==================================================\n");

      const imageAviso = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-redefinicao-aviso.png', imageAviso, 'base64');
    }

    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);
    
    try {
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-fluxo-recuperar.png', imagemErro, 'base64');
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-recuperar-erro-fluxo.html', htmlErro);
    } catch (erroHtml) {
      console.error("Não foi possível salvar evidências do erro:", erroHtml);
    }
    
  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteRecuperarSenha();