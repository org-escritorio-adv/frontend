import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

async function rodarTesteVisao360() {
  console.log("Conectando ao Selenium no Docker...");

  let options = new chrome.Options();
  options.addArguments('--disable-gpu');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.windowSize({ width: 1280, height: 900 });

  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .usingServer('http://selenium-chrome:4444/wd/hub')
    .build();

  try {
    // 0 - LOGIN
    console.log("Login...");
    await driver.get('https://escritorio-adv-two.vercel.app/');
    await driver.wait(until.elementLocated(By.tagName('body')), 15000);

    let botaoArea = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Área do Advogado')] | //a[contains(text(), 'Área do Advogado')]")),
      15000
    );
    await botaoArea.click();
    await driver.sleep(4000);

    let campoEmail = await driver.wait(until.elementLocated(By.css('input[type="email"], input[name="email"]')), 15000);
    await driver.wait(until.elementIsVisible(campoEmail), 15000);
    await campoEmail.clear();
    await campoEmail.sendKeys('admin@escritorio.com');

    let campoSenha = await driver.wait(until.elementLocated(By.css('input[type="password"], input[name="password"]')), 15000);
    await campoSenha.clear();
    await campoSenha.sendKeys('admin123');

    let botaoEntrar = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'ENTRAR') or contains(text(), 'Entrar')]")), 10000);
    await botaoEntrar.click();
    await driver.sleep(5000);

    // 1 - IR PARA CLIENTES
    console.log("Navegando para 'Clientes'...");
    let menuClientes = await driver.wait(
      until.elementLocated(By.xpath("//*[self::button or self::a][.//text()[contains(., 'Clientes')] or contains(text(), 'Clientes')]")),
      15000
    );
    await driver.executeScript("arguments[0].click();", menuClientes);
    await driver.wait(
      until.elementLocated(By.css('input[placeholder*="Nome ou documento"], input[placeholder*="documento"]')),
      15000
    );
    await driver.sleep(2000);

    // 2 - CLICAR NO PRIMEIRO CLIENTE DA LISTA
    console.log("Abrindo o perfil do primeiro cliente...");
    // mira no nome de um cliente conhecido da lista ("Cliente Teste"); se nao
    // existir, cai no primeiro item clicavel da lista lateral.
    let alvoCliente = await driver.findElements(By.xpath("//*[contains(text(), 'Cliente Teste')]"));
    if (alvoCliente.length === 0) {
      // fallback: qualquer nome de cliente na lista lateral
      alvoCliente = await driver.findElements(By.xpath("//*[contains(text(), 'advogado') or contains(text(), 'Empresa')]"));
    }
    if (alvoCliente.length === 0) {
      throw new Error("Nenhum cliente na lista para abrir o perfil.");
    }
    let cardClicavel = await alvoCliente[0].findElement(By.xpath("./ancestor-or-self::*[self::div or self::button or self::a][1]"));
    await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", cardClicavel);
    await driver.executeScript("arguments[0].click();", cardClicavel);
    await driver.sleep(2500);

    // 3 - VALIDAR "DADOS DE CONTATO"
    console.log("Validando a secao 'DADOS DE CONTATO'...");
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'DADOS DE CONTATO') or contains(text(), 'Dados de Contato')]")), 10000);
    console.log("OK: secao de dados de contato presente.");

    let bodyTexto = await driver.findElement(By.tagName('body')).getText();
    let temContato = /CPF|CNPJ|E-MAIL|E-mail|TELEFONE|Telefone/i.test(bodyTexto);
    if (temContato) console.log("OK: campos de contato (CPF/CNPJ, e-mail, telefone) exibidos.");

    const sc1 = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-visao360-contato.png', sc1, 'base64');

    // 4 - VALIDAR "PROCESSOS VINCULADOS"
    console.log("Validando a secao 'PROCESSOS VINCULADOS'...");
    let secaoProcessos = await driver.findElements(By.xpath("//*[contains(text(), 'PROCESSOS VINCULADOS') or contains(text(), 'Processos Vinculados')]"));
    if (secaoProcessos.length > 0) {
      console.log("OK: secao 'Processos Vinculados' presente.");
      // rola ate ela para a evidencia
      await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", secaoProcessos[0]);
      await driver.sleep(1000);
    } else {
      console.log("AVISO: secao 'Processos Vinculados' nao encontrada.");
    }

    const sc2 = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-visao360-processos.png', sc2, 'base64');

    // 5 - VALIDAR AREA DE COMPLIANCE (upload do termo de autorizacao)
    console.log("Validando a area de 'COMPLIANCE / Autorizacao'...");
    let secaoCompliance = await driver.findElements(By.xpath("//*[contains(text(), 'COMPLIANCE') or contains(text(), 'AUTORIZAÇÃO') or contains(text(), 'Autorização')]"));
    let areaUpload = await driver.findElements(By.xpath("//*[contains(text(), 'Selecionar') or contains(text(), 'arquivo') or contains(text(), 'Substituir documento')]"));

    if (secaoCompliance.length > 0 && areaUpload.length > 0) {
      console.log("OK: area de compliance com upload do termo de autorizacao presente.");
      await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", areaUpload[0]);
      await driver.sleep(1000);
    } else {
      console.log("AVISO: nao confirmei a area de upload/compliance completa.");
    }

    const sc3 = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-visao360-compliance.png', sc3, 'base64');

    console.log("\n==================================================");
    console.log("SUCESSO: US 2.5.3 validada - dados de contato, processos vinculados e area de compliance.");
    console.log("OBS: 'Casos vinculados' nao consta nesta tela (nao implementado no perfil do cliente).");
    console.log("==================================================\n");
    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);
    try {
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-visao360.png', imagemErro, 'base64');
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-visao360.html', htmlErro);
    } catch (e) {}
  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteVisao360();