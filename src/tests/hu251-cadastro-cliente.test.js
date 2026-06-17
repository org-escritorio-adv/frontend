import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

// Dados dinâmicos para evitar erro de duplicidade
const CLIENTE_NOME = 'Cliente Teste ' + Math.floor(Math.random() * 10000);
const CLIENTE_CPF = '12345678901'; // Apenas números conforme o placeholder

async function rodarTesteCadastroCliente() {
  console.log("Conectando ao Selenium no Docker...");

  let options = new chrome.Options();
  options.addArguments('--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage');
  options.windowSize({ width: 1400, height: 900 });

  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .usingServer('http://selenium-chrome:4444/wd/hub')
    .build();

  try {
    // =========================================================================
    // 0 - LOGIN (Mantido o padrão do seu projeto)
    // =========================================================================
    await driver.get('http://frontend:3000');
    let seletorAreaAdvogado = By.xpath("//button[contains(text(), 'Área do Advogado')] | //a[contains(text(), 'Área do Advogado')]");
    await (await driver.wait(until.elementLocated(seletorAreaAdvogado), 15000)).click();
    await driver.sleep(2000);

    let campoEmail = await driver.wait(until.elementLocated(By.css('input[type="email"], input[name="email"]')), 15000);
    await campoEmail.sendKeys('admin@escritorio.com');
    await (await driver.findElement(By.css('input[type="password"], input[name="password"]'))).sendKeys('12345678A');
    await (await driver.findElement(By.xpath("//button[contains(text(), 'ENTRAR') or contains(text(), 'Entrar')]"))).click();
    await driver.sleep(3000);

    // =========================================================================
    // 1 - NAVEGAÇÃO: PROCESSOS > CLIENTES
    // =========================================================================
    console.log("Navegando até o menu de Processos/Clientes...");
    let seletorMenuProc = By.xpath("//*[self::button or self::a][.//text()[contains(., 'Proc')] or contains(text(), 'Proc')]");
    await (await driver.wait(until.elementLocated(seletorMenuProc), 15000)).click();
    await driver.sleep(2000);

    let seletorSubClientes = By.xpath("//*[contains(text(), 'Clientes')]");
    let abriuClientes = await driver.findElements(seletorSubClientes);
    if (abriuClientes.length > 0) {
      await abriuClientes[0].click();
      await driver.sleep(2000);
    }

    // =========================================================================
    // 2 - ABRIR POPUP "NOVO CLIENTE"
    // =========================================================================
    console.log("Buscando o botão 'Novo cliente'...");
    let seletorNovoCliente = By.xpath("//button[contains(text(), 'Novo cliente') or contains(text(), 'Novo Cliente')]");
    let botaoNovoCliente = await driver.wait(until.elementLocated(seletorNovoCliente), 10000);
    await botaoNovoCliente.click();
    
    // Aguarda o modal "Novo Cliente" renderizar na tela
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Novo Cliente')]")), 10000);
    await driver.sleep(1500);

    // =========================================================================
    // 3 - PREENCHER FORMULÁRIO CONFORME A INTERFACE ATUAL
    // =========================================================================
    
    // 1º Campo: NOME OU RAZÃO SOCIAL
    console.log(`Preenchendo Nome ou Razão Social: ${CLIENTE_NOME}...`);
    let seletorNome = By.xpath("//input[contains(@placeholder, 'João da Silva') or contains(@placeholder, 'Empresa X')]");
    let inputNome = await driver.wait(until.elementLocated(seletorNome), 10000);
    await inputNome.sendKeys(CLIENTE_NOME);

    // 2º Campo: CPF / CNPJ
    console.log(`Preenchendo CPF/CNPJ (Apenas números): ${CLIENTE_CPF}...`);
    let seletorDoc = By.xpath("//input[contains(@placeholder, 'Apenas números')]");
    let inputDoc = await driver.wait(until.elementLocated(seletorDoc), 10000);
    await inputDoc.sendKeys(CLIENTE_CPF);

    // 3º Campo: Checkbox do Termo de Consentimento (LGPD)
    console.log("Marcando o Termo de Consentimento (LGPD)...");
    // Clica no texto ou na div do termo para mitigar problemas com a caixa do input oculta
    let seletorLgpd = By.xpath("//*[contains(text(), 'Termo de Consentimento')] | //*[contains(text(), 'Declaro que o cliente forneceu')]");
    let containerLgpd = await driver.wait(until.elementLocated(seletorLgpd), 10000);
    await containerLgpd.click();
    await driver.sleep(1500); 

    // =========================================================================
    // 4 - CONFIRMAR CADASTRO ("Criar Cliente")
    // =========================================================================
    console.log("Clicando no botão 'Criar Cliente'...");
    let seletorCriarCliente = By.xpath("//button[contains(., 'Criar Cliente')] | //*[normalize-space(text())='Criar Cliente']");
    let botaoCriarCliente = await driver.wait(until.elementLocated(seletorCriarCliente), 10000);
    
    // Força o clique via script para garantir que seja disparado após a liberação do botão
    await driver.executeScript("arguments[0].click();", botaoCriarCliente);
    
    // Aguarda o tempo de processamento
    await driver.sleep(3000); 

    console.log(`\n==================================================`);
    console.log(`SUCESSO: Clique no botão Criar Cliente executado!`);
    console.log(`==================================================\n`);

    const screenshotSucesso = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-cadastro-cliente.png', screenshotSucesso, 'base64');

  } catch (erro) {
    console.error("O teste de cadastro de cliente falhou:", erro);
    try {
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-cadastro-cliente.png', imagemErro, 'base64');
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-cadastro-cliente.html', htmlErro);
    } catch (e) {
      console.error("Não foi possível gerar relatórios de erro:", e);
    }
  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteCadastroCliente();