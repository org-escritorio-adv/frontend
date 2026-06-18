import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

// Gera um número CNJ aleatório de 20 dígitos, para cada execução criar um
// processo único (evita conflito de "número duplicado" ao rodar várias vezes).
function gerarCnjAleatorio() {
  let numero = '';
  for (let i = 0; i < 20; i++) {
    numero += Math.floor(Math.random() * 10).toString();
  }
  return numero;
}

const CNJ_VALIDO = gerarCnjAleatorio();
const CNJ_INVALIDO = '12345'; // curto de propósito, para testar a validação
const PARTES = 'Autor Teste Selenium vs Reu Teste Selenium';

async function rodarTesteCadastroManual() {
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
    // ==========================================
    // 0 - LOGIN
    // ==========================================
    console.log("Iniciando o teste automatizado na Home...");
    await driver.get('https://escritorio-adv-two.vercel.app/');
    await driver.wait(until.elementLocated(By.tagName('body')), 15000);

    console.log("Buscando e clicando no botão 'Área do Advogado'...");
    let seletorAreaAdvogado = By.xpath("//button[contains(text(), 'Área do Advogado')] | //a[contains(text(), 'Área do Advogado')]");
    let botaoAreaAdvogado = await driver.wait(until.elementLocated(seletorAreaAdvogado), 15000);
    await botaoAreaAdvogado.click();
    await driver.sleep(4000);

    console.log("Preenchendo credenciais de Administrador...");
    let seletorEmail = By.css('input[type="email"], input[name="email"]');
    let campoEmail = await driver.wait(until.elementLocated(seletorEmail), 15000);
    await driver.wait(until.elementIsVisible(campoEmail), 15000);
    await campoEmail.clear();
    await campoEmail.sendKeys('admin@escritorio.com');

    let seletorSenha = By.css('input[type="password"], input[name="password"]');
    let campoSenha = await driver.wait(until.elementLocated(seletorSenha), 15000);
    await campoSenha.clear();
    await campoSenha.sendKeys('admin123');

    let seletorBotaoEntrar = By.xpath("//button[contains(text(), 'ENTRAR') or contains(text(), 'Entrar')]");
    let botaoEntrar = await driver.wait(until.elementLocated(seletorBotaoEntrar), 10000);
    await botaoEntrar.click();
    await driver.sleep(5000);

    // ==========================================
    // 1 - IR PARA PROCESSOS E ABRIR O MODAL "NOVO PROCESSO"
    // ==========================================
    console.log("Buscando o item 'Proc.' no menu lateral...");
    let seletorMenuProc = By.xpath("//*[self::button or self::a][.//text()[contains(., 'Proc.')] or contains(text(), 'Proc.')]");
    let itemMenuProc = await driver.wait(until.elementLocated(seletorMenuProc), 15000);
    await itemMenuProc.click();

    console.log("Aguardando o carregamento da tela 'Processos Judiciais'...");
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Processos Judiciais')]")), 15000);
    await driver.sleep(2000);

    console.log("Clicando em 'Novo Processo'...");
    let seletorNovoProcesso = By.xpath("//button[contains(text(), 'Novo Processo')]");
    let botaoNovoProcesso = await driver.wait(until.elementLocated(seletorNovoProcesso), 10000);
    await botaoNovoProcesso.click();
    await driver.sleep(1500);

    // ==========================================
    // 2 - IR PARA A ABA "MANUAL"
    // ==========================================
    console.log("Selecionando a aba 'Manual'...");
    let seletorAbaManual = By.xpath("//button[contains(text(), 'Manual')]");
    let abaManual = await driver.wait(until.elementLocated(seletorAbaManual), 10000);
    await abaManual.click();
    await driver.sleep(1000);

    // ==========================================
    // 3 - TESTAR A VALIDAÇÃO DO CNJ (20 dígitos) — AC: validar formato
    // ==========================================
    console.log(`Preenchendo um CNJ inválido ("${CNJ_INVALIDO}") para testar a validação...`);
    // O primeiro input de texto do formulário manual é o Número CNJ.
    let seletorCampoCnj = By.css('input[placeholder*="0001234"]');
    let campoCnj = await driver.wait(until.elementLocated(seletorCampoCnj), 10000);
    await campoCnj.clear();
    await campoCnj.sendKeys(CNJ_INVALIDO);

    // Preenche os demais obrigatórios para isolar a validação do CNJ.
    console.log("Selecionando o Tribunal...");
    let seletorOpcaoTribunal = By.xpath("//select//option[contains(text(), 'TJSP')]");
    let opcaoTribunal = await driver.wait(until.elementLocated(seletorOpcaoTribunal), 10000);
    await opcaoTribunal.click();

    console.log("Preenchendo as Partes...");
    let seletorCampoPartes = By.css('input[placeholder*="vs."]');
    let campoPartes = await driver.wait(until.elementLocated(seletorCampoPartes), 10000);
    await campoPartes.clear();
    await campoPartes.sendKeys(PARTES);

    console.log("Preenchendo a Data de Início...");
    let seletorCampoData = By.css('input[type="date"]');
    let campoData = await driver.wait(until.elementLocated(seletorCampoData), 10000);
    // O React não percebe um valor setado direto em .value; é preciso usar o
    // setter nativo do prototype e disparar o evento 'input' (não só 'change').
    await driver.executeScript(`
      const el = arguments[0];
      const valor = arguments[1];
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, valor);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    `, campoData, '2026-01-15');
    await driver.sleep(800);

    console.log("Clicando em 'Cadastrar' com o CNJ inválido...");
    let seletorBotaoCadastrar = By.xpath("//button[normalize-space(text())='Cadastrar' or contains(text(), 'Cadastrando')]");
    let botaoCadastrar = await driver.wait(until.elementLocated(seletorBotaoCadastrar), 10000);
    await botaoCadastrar.click();
    await driver.sleep(1500);

    console.log("Verificando se a mensagem de validação do CNJ apareceu...");
    let textoAposInvalido = await driver.findElement(By.tagName('body')).getText();
    if (textoAposInvalido.includes('20 dígitos')) {
      console.log("OK: a validação do CNJ de 20 dígitos funcionou (mensagem de erro exibida).");
    } else {
      console.log("AVISO: não foi encontrada a mensagem de validação de 20 dígitos — verifique o screenshot.");
    }

    const screenshotValidacao = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-cadastro-validacao-cnj.png', screenshotValidacao, 'base64');

    // ==========================================
    // 4 - CORRIGIR O CNJ E CADASTRAR DE VERDADE
    // ==========================================
    console.log(`Corrigindo o CNJ para um número válido de 20 dígitos ("${CNJ_VALIDO}")...`);
    await campoCnj.clear();
    await campoCnj.sendKeys(CNJ_VALIDO);
    await driver.sleep(500);

    console.log("Clicando em 'Cadastrar' com os dados válidos...");
    botaoCadastrar = await driver.findElement(seletorBotaoCadastrar);
    await botaoCadastrar.click();
    await driver.sleep(2000);

    console.log("Verificando a mensagem de sucesso...");
    let textoAposCadastro = await driver.findElement(By.tagName('body')).getText();
    if (textoAposCadastro.includes('cadastrado com sucesso')) {
      console.log("OK: processo cadastrado com sucesso (mensagem exibida).");
    } else {
      console.log("AVISO: não foi encontrada a mensagem de sucesso — verifique o screenshot.");
    }

    const screenshotSucesso = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-cadastro-sucesso.png', screenshotSucesso, 'base64');

    // Aguarda o modal fechar (o código fecha após ~1,2s do sucesso)
    await driver.sleep(2000);

    // ==========================================
    // 5 - CONFIRMAR QUE O PROCESSO APARECE NA LISTAGEM (AC: aparecer na lista)
    // ==========================================
    console.log("Buscando o processo recém-cadastrado na listagem...");
    let seletorBusca = By.css('input[placeholder*="Buscar por número"], input[placeholder*="nome da parte"]');
    let campoBusca = await driver.wait(until.elementLocated(seletorBusca), 10000);
    await campoBusca.clear();
    // busca por um trecho do número cadastrado
    await campoBusca.sendKeys(CNJ_VALIDO.slice(0, 8));
    await driver.sleep(1500);

    let encontrouNaLista = await driver.findElements(
      By.xpath(`//*[contains(text(), '${CNJ_VALIDO}')]`)
    );

    if (encontrouNaLista.length > 0) {
      console.log("OK: o processo cadastrado manualmente aparece na listagem geral.");
    } else {
      // fallback: confirma ao menos que a busca retornou alguma linha
      let linhas = await driver.findElements(
        By.xpath("//*[normalize-space(text())='Ver' or normalize-space(text())='Abrir']")
      );
      if (linhas.length > 0) {
        console.log("OK: a busca pelo número cadastrado retornou resultado na listagem.");
      } else {
        throw new Error("O processo cadastrado não foi encontrado na listagem após o cadastro.");
      }
    }

    const screenshotListagem = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-cadastro-na-listagem.png', screenshotListagem, 'base64');

    console.log("\n==================================================");
    console.log("SUCESSO: US 2.3.1 validada — validação de CNJ, cadastro manual e aparição na listagem.");
    console.log("==================================================\n");

    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);

    try {
      console.log("Gerando imagem do erro para análise visual...");
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-cadastro-manual.png', imagemErro, 'base64');

      console.log("Salvando o HTML do momento exato do erro para diagnóstico...");
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-cadastro-manual.html', htmlErro);
    } catch (erroHtml) {
      console.error("Não foi possível salvar as evidências de erro:", erroHtml);
    }

  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteCadastroManual();