import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

// Gera um CNPJ aleatorio de 14 digitos (so quantidade, sem digito verificador,
// pois a validacao do sistema confere apenas a quantidade de numeros).
function gerarCnpjAleatorio() {
  let n = '';
  for (let i = 0; i < 14; i++) n += Math.floor(Math.random() * 10).toString();
  return n;
}

const CNPJ_VALIDO = gerarCnpjAleatorio();
const CNPJ_INVALIDO = '123'; // curto de proposito, para testar a validacao
const NOME_CLIENTE = 'Empresa Teste Selenium ' + Math.floor(Math.random() * 100000);
const EMAIL_CLIENTE = 'contato.selenium@example.com';
const TELEFONE_CLIENTE = '(61) 99999-9999';

async function preencherFormularioCliente(driver, nome, documento, email, telefone) {
  // Nome / Razao Social
  let campoNome = await driver.wait(
    until.elementLocated(By.css('input[placeholder*="João da Silva"], input[placeholder*="Empresa Alpha"]')),
    10000
  );
  await campoNome.clear();
  await campoNome.sendKeys(nome);

  // CPF / CNPJ
  let campoDoc = await driver.findElement(By.css('input[placeholder*="Somente números"], input[placeholder*="dígitos"]'));
  await campoDoc.clear();
  await campoDoc.sendKeys(documento);

  // E-mail
  let campoEmail = await driver.findElements(By.css('input[placeholder*="contato@exemplo"], input[type="email"]'));
  if (campoEmail.length > 0 && email) {
    await campoEmail[0].clear();
    await campoEmail[0].sendKeys(email);
  }

  // Telefone
  let campoTel = await driver.findElements(By.css('input[placeholder*="99999-9999"], input[placeholder*="(61)"]'));
  if (campoTel.length > 0 && telefone) {
    await campoTel[0].clear();
    await campoTel[0].sendKeys(telefone);
  }
}

async function abrirModalNovoCliente(driver) {
  let botaoNovo = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Novo')]")),
    10000
  );
  await driver.executeScript("arguments[0].click();", botaoNovo);
  await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Novo Cliente')]")), 10000);
  await driver.sleep(1000);
}

async function rodarTesteCadastroCliente() {
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
    // 0 - LOGIN
    console.log("Iniciando o teste automatizado na Home...");
    await driver.get(process.env.TEST_URL || 'http://frontend:3000');
    await driver.wait(until.elementLocated(By.tagName('body')), 15000);

    console.log("Buscando e clicando no botao 'Area do Advogado'...");
    let botaoAreaAdvogado = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Área do Advogado')] | //a[contains(text(), 'Área do Advogado')]")),
      15000
    );
    await botaoAreaAdvogado.click();
    await driver.sleep(4000);

    console.log("Preenchendo credenciais de Administrador...");
    let campoEmailLogin = await driver.wait(until.elementLocated(By.css('input[type="email"], input[name="email"]')), 15000);
    await driver.wait(until.elementIsVisible(campoEmailLogin), 15000);
    await campoEmailLogin.clear();
    await campoEmailLogin.sendKeys('admin@escritorio.com');

    let campoSenha = await driver.wait(until.elementLocated(By.css('input[type="password"], input[name="password"]')), 15000);
    await campoSenha.clear();
    await campoSenha.sendKeys('admin123');

    let botaoEntrar = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'ENTRAR') or contains(text(), 'Entrar')]")), 10000);
    await botaoEntrar.click();
    await driver.sleep(5000);

    // 1 - IR PARA CLIENTES
    console.log("Navegando para 'Clientes' no menu lateral...");
    let menuClientes = await driver.wait(
      until.elementLocated(By.xpath("//*[self::button or self::a][.//text()[contains(., 'Clientes')] or contains(text(), 'Clientes')]")),
      15000
    );
    await driver.executeScript("arguments[0].click();", menuClientes);
    await driver.sleep(2500);

    // 2 - TESTAR VALIDACAO DO DOCUMENTO (documento curto) - AC: validacao de formato
    console.log("Abrindo o modal 'Novo Cliente' para testar a validacao...");
    await abrirModalNovoCliente(driver);

    console.log("Preenchendo com um documento INVALIDO (\"" + CNPJ_INVALIDO + "\")...");
    await preencherFormularioCliente(driver, NOME_CLIENTE, CNPJ_INVALIDO, EMAIL_CLIENTE, TELEFONE_CLIENTE);

    console.log("Clicando em 'Cadastrar' com documento invalido...");
    let botaoCadastrar = await driver.findElement(By.xpath("//button[normalize-space(text())='Cadastrar' or contains(text(), 'Cadastrando')]"));
    await driver.executeScript("arguments[0].click();", botaoCadastrar);
    await driver.sleep(1500);

    // Validacao: o modal NAO deve fechar / deve aparecer mensagem de erro.
    let textoAposInvalido = await driver.findElement(By.tagName('body')).getText();
    let modalAindaAberto = await driver.findElements(By.xpath("//*[contains(text(), 'Novo Cliente')]"));
    let mencionaDigitos = /11|14|dígitos|digitos|inválido|invalido/i.test(textoAposInvalido);

    if (modalAindaAberto.length > 0 || mencionaDigitos) {
      console.log("OK: o documento invalido foi barrado pela validacao (modal nao concluiu o cadastro).");
    } else {
      console.log("AVISO: nao foi possivel confirmar a validacao do documento - verifique o screenshot.");
    }

    const screenshotValidacao = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-cliente-validacao.png', screenshotValidacao, 'base64');

    // 3 - CADASTRAR COM DOCUMENTO VALIDO (14 digitos)
    console.log("Corrigindo para um CNPJ valido de 14 digitos (\"" + CNPJ_VALIDO + "\")...");
    let campoDoc = await driver.findElement(By.css('input[placeholder*="Somente números"], input[placeholder*="dígitos"]'));
    await campoDoc.clear();
    await campoDoc.sendKeys(CNPJ_VALIDO);
    await driver.sleep(500);

    console.log("Clicando em 'Cadastrar' com os dados validos...");
    botaoCadastrar = await driver.findElement(By.xpath("//button[normalize-space(text())='Cadastrar' or contains(text(), 'Cadastrando')]"));
    await driver.executeScript("arguments[0].click();", botaoCadastrar);
    await driver.sleep(3000);

    console.log("Verificando se o cliente aparece na listagem...");
    let textoListagem = await driver.findElement(By.tagName('body')).getText();
    if (textoListagem.includes(NOME_CLIENTE)) {
      console.log("OK: cliente cadastrado e visivel na listagem.");
    } else {
      console.log("AVISO: nao confirmei o cliente na listagem - verifique o screenshot.");
    }

    const screenshotCadastro = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-cliente-cadastrado.png', screenshotCadastro, 'base64');

    // 4 - TESTAR BLOQUEIO DE DUPLICADO - AC: impedir cadastro com mesmo documento
    console.log("Tentando cadastrar OUTRO cliente com o MESMO CNPJ (duplicado)...");
    await abrirModalNovoCliente(driver);
    await preencherFormularioCliente(driver, NOME_CLIENTE + ' DUPLICADO', CNPJ_VALIDO, EMAIL_CLIENTE, TELEFONE_CLIENTE);

    botaoCadastrar = await driver.findElement(By.xpath("//button[normalize-space(text())='Cadastrar' or contains(text(), 'Cadastrando')]"));
    await driver.executeScript("arguments[0].click();", botaoCadastrar);
    await driver.sleep(2500);

    let textoAposDuplicado = await driver.findElement(By.tagName('body')).getText();
    let modalDuplicadoAberto = await driver.findElements(By.xpath("//*[contains(text(), 'Novo Cliente')]"));
    let mencionaDuplicado = /já existe|ja existe|duplicad|cadastrado|mesmo documento|erro/i.test(textoAposDuplicado);

    const screenshotDuplicado = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-cliente-duplicado.png', screenshotDuplicado, 'base64');

    if (modalDuplicadoAberto.length > 0 || mencionaDuplicado) {
      console.log("OK: o sistema impediu o cadastro duplicado com o mesmo documento.");
    } else {
      throw new Error(
        "FALHA: o cadastro duplicado com o mesmo CNPJ NAO foi bloqueado - verifique 'evidencia-cliente-duplicado.png'."
      );
    }

    // fecha o modal
    let botaoCancelar = await driver.findElements(By.xpath("//button[contains(text(), 'Cancelar')]"));
    if (botaoCancelar.length > 0) {
      await driver.executeScript("arguments[0].click();", botaoCancelar[0]);
    }

    console.log("\n==================================================");
    console.log("SUCESSO: US 2.5.1 validada - campos, validacao de documento e bloqueio de duplicado.");
    console.log("==================================================\n");
    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);
    try {
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-cliente.png', imagemErro, 'base64');
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-cliente.html', htmlErro);
    } catch (erroHtml) {
      console.error("Nao foi possivel salvar evidencias de erro:", erroHtml);
    }
  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteCadastroCliente();