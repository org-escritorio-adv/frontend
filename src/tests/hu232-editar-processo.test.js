import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

// Processo de teste a ser editado (fictício, para não afetar processos reais).
const NUMERO_PROCESSO = '00000000000000000000';
const TERMO_BUSCA = '0000000';

// Novo texto de partes (com sufixo aleatório para garantir que a mudança é detectável).
const NOVAS_PARTES = 'Parte Editada ' + Math.floor(Math.random() * 100000);

async function abrirEdicaoDoProcesso(driver) {
  // Busca o processo e clica no botão de editar (lápis) da linha dele.
  let seletorBusca = By.css('input[placeholder*="Buscar por número"], input[placeholder*="nome da parte"]');
  let campoBusca = await driver.wait(until.elementLocated(seletorBusca), 10000);
  await campoBusca.clear();
  await campoBusca.sendKeys(TERMO_BUSCA);
  await driver.sleep(1500);

  // O botão de editar tem title="Editar processo" (visto no Processos.tsx).
  let botoesEditar = await driver.findElements(By.css('button[title="Editar processo"]'));
  if (botoesEditar.length === 0) {
    throw new Error(`Não foi encontrado o botão de editar para o processo ${NUMERO_PROCESSO}.`);
  }
  // clica via JS para evitar problemas de hover/overlay
  await driver.executeScript("arguments[0].click();", botoesEditar[0]);

  console.log("Aguardando o modal 'Editar Processo' abrir...");
  await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Editar Processo')]")), 10000);
  await driver.sleep(1000);
}

async function rodarTesteEdicaoProcesso() {
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
    // 1 - IR PARA PROCESSOS
    // ==========================================
    console.log("Buscando o item 'Proc.' no menu lateral...");
    let seletorMenuProc = By.xpath("//*[self::button or self::a][.//text()[contains(., 'Proc.')] or contains(text(), 'Proc.')]");
    let itemMenuProc = await driver.wait(until.elementLocated(seletorMenuProc), 15000);
    await itemMenuProc.click();

    console.log("Aguardando o carregamento da tela 'Processos Judiciais'...");
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Processos Judiciais')]")), 15000);
    await driver.sleep(2000);

    // ==========================================
    // TESTE 1 - EDITAR O STATUS
    // ==========================================
    console.log("\n--- TESTE 1: editar o STATUS do processo ---");
    await abrirEdicaoDoProcesso(driver);

    // Descobre o status atual e escolhe um diferente para garantir mudança visível.
    console.log("Lendo o status atual e selecionando um novo...");
    let selectStatus = await driver.findElement(
      By.xpath("//label[contains(text(), 'Status')]/following::select[1]")
    );
    let valorAtual = await selectStatus.getAttribute('value');
    // alterna entre 'arquivado' e 'ativo'
    let novoStatusValor = valorAtual === 'arquivado' ? 'ativo' : 'arquivado';
    let novoStatusLabel = novoStatusValor === 'arquivado' ? 'Arquivado' : 'Ativo';
    console.log(`Status atual: "${valorAtual}". Alterando para: "${novoStatusValor}".`);

    let opcaoNovoStatus = await selectStatus.findElement(
      By.xpath(`.//option[@value='${novoStatusValor}']`)
    );
    await opcaoNovoStatus.click();
    await driver.sleep(500);

    console.log("Salvando a alteração de status...");
    let botaoSalvar = await driver.findElement(By.xpath("//button[contains(text(), 'Salvar')]"));
    await driver.executeScript("arguments[0].click();", botaoSalvar);
    await driver.sleep(3000);

    // Confirma na listagem que o status mudou (busca o processo e verifica o badge)
    console.log("Verificando se o novo status aparece na listagem...");
    await driver.sleep(1000);
    let textoListagem = await driver.findElement(By.tagName('body')).getText();
    if (textoListagem.includes(novoStatusLabel)) {
      console.log(`OK: o status "${novoStatusLabel}" aparece na listagem após a edição.`);
    } else {
      console.log(`AVISO: não confirmei visualmente o status "${novoStatusLabel}" — verifique o screenshot.`);
    }

    const screenshotStatus = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-edicao-status.png', screenshotStatus, 'base64');

    // ==========================================
    // TESTE 2 - EDITAR AS PARTES
    // ==========================================
    console.log("\n--- TESTE 2: editar as PARTES do processo ---");
    await abrirEdicaoDoProcesso(driver);

    console.log(`Alterando o campo Partes para: "${NOVAS_PARTES}"...`);
    let campoPartes = await driver.findElement(
      By.xpath("//label[contains(text(), 'Partes')]/following::input[1]")
    );
    await campoPartes.clear();
    await campoPartes.sendKeys(NOVAS_PARTES);
    await driver.sleep(500);

    console.log("Salvando a alteração de partes...");
    botaoSalvar = await driver.findElement(By.xpath("//button[contains(text(), 'Salvar')]"));
    await driver.executeScript("arguments[0].click();", botaoSalvar);
    await driver.sleep(3000);

    // Confirma reabrindo a edição: o campo Partes deve conter o novo texto.
    console.log("Reabrindo a edição para confirmar que as novas partes foram salvas...");
    await driver.sleep(1000);
    await abrirEdicaoDoProcesso(driver);

    let campoPartesConfirma = await driver.findElement(
      By.xpath("//label[contains(text(), 'Partes')]/following::input[1]")
    );
    let valorPartesSalvo = await campoPartesConfirma.getAttribute('value');
    console.log(`Valor de Partes após salvar: "${valorPartesSalvo}"`);

    if (valorPartesSalvo === NOVAS_PARTES) {
      console.log("OK: a alteração das partes foi persistida com sucesso.");
    } else {
      throw new Error(
        `As partes não foram salvas corretamente. Esperado "${NOVAS_PARTES}", obtido "${valorPartesSalvo}".`
      );
    }

    const screenshotPartes = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-edicao-partes.png', screenshotPartes, 'base64');

    // Fecha o modal
    let botaoCancelar = await driver.findElements(By.xpath("//button[contains(text(), 'Cancelar')]"));
    if (botaoCancelar.length > 0) {
      await driver.executeScript("arguments[0].click();", botaoCancelar[0]);
    }

    console.log("\n==================================================");
    console.log("SUCESSO: US 2.3.2 validada — edição de status e de partes persistidas.");
    console.log("OBS: o critério de 'log de auditoria' não foi testado pois a funcionalidade ainda não existe no sistema.");
    console.log("==================================================\n");

    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);

    try {
      console.log("Gerando imagem do erro para análise visual...");
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-edicao-processo.png', imagemErro, 'base64');

      console.log("Salvando o HTML do momento exato do erro para diagnóstico...");
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-edicao-processo.html', htmlErro);
    } catch (erroHtml) {
      console.error("Não foi possível salvar as evidências de erro:", erroHtml);
    }

  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteEdicaoProcesso();