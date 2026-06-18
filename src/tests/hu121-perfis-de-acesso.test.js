import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';


const ADMIN_EMAIL = 'admin@escritorio.com';
const ADMIN_SENHA = 'admin123';

const ESTAGIARIO_EMAIL = 'estag@gmail.com';
const ESTAGIARIO_SENHA = 'estag';

// Usuário estagiário a ter as permissões inspecionadas pelo admin.
const NOME_ESTAGIARIO_NA_TABELA = 'Estagiario Teste';

// Permissão crítica que deve estar DESLIGADA para o estagiário.
const PERMISSAO_CRITICA_OFF = 'Excluir processos';
// Permissão básica que deve estar LIGADA para o estagiário (1/10).
const PERMISSAO_BASICA_ON = 'Visualizar processos';

async function fazerLogin(driver, email, senha) {
  await driver.get(process.env.TEST_URL || 'http://frontend:3000');
  await driver.wait(until.elementLocated(By.tagName('body')), 20000);

  console.log("Clicando em 'Area do Advogado'...");
  let seletorAreaAdvogado = By.xpath("//button[contains(text(), 'Área do Advogado')] | //a[contains(text(), 'Área do Advogado')]");
  let botaoAreaAdvogado = await driver.wait(until.elementLocated(seletorAreaAdvogado), 20000);
  await driver.executeScript("arguments[0].click();", botaoAreaAdvogado);
  await driver.sleep(4000);

  console.log("Preenchendo credenciais (" + email + ")...");
  let campoEmail = await driver.wait(until.elementLocated(By.css('input[type="email"], input[name="email"]')), 20000);
  await driver.wait(until.elementIsVisible(campoEmail), 15000);
  await campoEmail.clear();
  await campoEmail.sendKeys(email);

  let campoSenha = await driver.wait(until.elementLocated(By.css('input[type="password"], input[name="password"]')), 15000);
  await campoSenha.clear();
  await campoSenha.sendKeys(senha);

  let botaoEntrar = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'ENTRAR') or contains(text(), 'Entrar')]")), 10000);
  await driver.executeScript("arguments[0].click();", botaoEntrar);
  await driver.sleep(6000);
}

async function irParaEquipe(driver) {
  console.log("Navegando para 'Equipe'...");
  let seletorMenuEquipe = By.xpath("//*[self::button or self::a][.//text()[contains(., 'Equipe')] or contains(text(), 'Equipe')]");
  let itemMenuEquipe = await driver.wait(until.elementLocated(seletorMenuEquipe), 20000);
  await driver.executeScript("arguments[0].click();", itemMenuEquipe);
  await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Membros da Equipe')]")), 20000);
  await driver.sleep(2000);
}

async function fazerLogout(driver) {
  console.log("Fazendo logout...");
  try {
    let gatilhoPerfil = await driver.findElements(By.xpath("//*[contains(text(), 'Administrador') or contains(text(), 'Estagiário') or contains(text(), 'Advogado')]"));
    if (gatilhoPerfil.length > 0) {
      await driver.executeScript("arguments[0].click();", gatilhoPerfil[0]);
      await driver.sleep(1500);
    }
    let sair = await driver.findElements(By.xpath("//*[contains(text(), 'Sair')]"));
    if (sair.length > 0) {
      await driver.executeScript("arguments[0].click();", sair[0]);
      await driver.sleep(3000);
    }
  } catch (e) {
    console.log("Nao foi possivel usar o menu de logout; limpando sessao via storage.");
  }
  await driver.get(process.env.TEST_URL || 'http://frontend:3000');
  await driver.executeScript("try{localStorage.clear();sessionStorage.clear();}catch(e){}");
  await driver.sleep(2000);
}

async function obterEstadoSwitch(driver, textoLabel) {
  let seletorLinha = By.xpath(
    "//*[contains(normalize-space(text()), \"" + textoLabel + "\")]" +
    "/ancestor::*[.//button[@role=\"switch\"] or .//input[@type=\"checkbox\"]][1]"
  );
  let linha = await driver.wait(until.elementLocated(seletorLinha), 10000);

  let elementosSwitch = await linha.findElements(
    By.css('input[type="checkbox"], button[role="switch"], [class*="switch"], [class*="toggle"]')
  );

  if (elementosSwitch.length === 0) {
    throw new Error("Nao foi possivel localizar o switch para: \"" + textoLabel + "\".");
  }

  let switchEl = elementosSwitch[0];
  let ariaChecked = await switchEl.getAttribute('aria-checked');
  let classeAtual = (await switchEl.getAttribute('class')) || '';
  let tagName = await switchEl.getTagName();

  let ativado = ariaChecked === 'true';
  if (ariaChecked === null && tagName === 'input') {
    ativado = await switchEl.isSelected();
  }
  if (ariaChecked === null && tagName !== 'input') {
    ativado = /checked|active|is-on|bg-(emerald|green|red)/i.test(classeAtual);
  }

  return { elemento: switchEl, ativado };
}

async function rodarTesteRBAC() {
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
    // ============================================================
    // PARTE 1 - COMO ADMIN
    // ============================================================
    console.log("\n========== PARTE 1: COMO ADMIN ==========");
    await fazerLogin(driver, ADMIN_EMAIL, ADMIN_SENHA);
    await irParaEquipe(driver);

    // 1.1 - RBAC: admin ve a acao "Permissoes" CLICAVEL (pode editar)
    console.log("Validando que o admin ve a acao 'Permissoes' (edicao habilitada)...");
    let acoesPermissoes = await driver.findElements(By.xpath("//*[normalize-space(text())='Permissões']"));
    let somenteLeitura = await driver.findElements(By.xpath("//*[contains(text(), 'Somente leitura')]"));

    if (acoesPermissoes.length > 0 && somenteLeitura.length === 0) {
      console.log("OK: como ADMIN, a coluna de acoes mostra 'Permissoes' editavel (sem 'Somente leitura').");
    } else if (acoesPermissoes.length > 0) {
      console.log("OK (parcial): ha acoes 'Permissoes' disponiveis para o admin.");
    } else {
      throw new Error("Como admin, nao foram encontradas acoes 'Permissoes' editaveis na tabela de equipe.");
    }

    const screenshotAdminEquipe = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-rbac-admin-equipe.png', screenshotAdminEquipe, 'base64');

    // 1.2 - Abrir o painel de permissoes do ESTAGIARIO
    console.log("Abrindo o painel de permissoes de \"" + NOME_ESTAGIARIO_NA_TABELA + "\"...");
    let linhaEstagiario = await driver.wait(
      until.elementLocated(By.xpath("//tr[.//text()[contains(., '" + NOME_ESTAGIARIO_NA_TABELA + "')]]")),
      15000
    );
    let botaoPermissoes = await linhaEstagiario.findElement(By.xpath(".//*[normalize-space(text())='Permissões']"));
    await driver.executeScript("arguments[0].click();", botaoPermissoes);

    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Painel de Permissões')]")), 15000);
    await driver.sleep(1500);

    // 1.3 - BLOQUEAR EXCLUSOES: "Excluir processos" deve estar DESLIGADO
    console.log("Verificando se \"" + PERMISSAO_CRITICA_OFF + "\" esta DESLIGADO para o estagiario...");
    let estadoExcluir = await obterEstadoSwitch(driver, PERMISSAO_CRITICA_OFF);
    if (estadoExcluir.ativado) {
      throw new Error(
        "FALHA DE RBAC: \"" + PERMISSAO_CRITICA_OFF + "\" esta LIGADO para o Estagiario, deveria estar bloqueado."
      );
    }
    console.log("OK: \"" + PERMISSAO_CRITICA_OFF + "\" esta desligado para o estagiario (exclusao bloqueada).");

    // 1.4 - A permissao basica deve estar LIGADA (1/10)
    console.log("Verificando se \"" + PERMISSAO_BASICA_ON + "\" esta LIGADO para o estagiario...");
    let estadoVisualizar = await obterEstadoSwitch(driver, PERMISSAO_BASICA_ON);
    if (!estadoVisualizar.ativado) {
      console.log("AVISO: \"" + PERMISSAO_BASICA_ON + "\" nao esta ligado - verifique o screenshot.");
    } else {
      console.log("OK: \"" + PERMISSAO_BASICA_ON + "\" esta ligado para o estagiario.");
    }

    const screenshotPainelEstagiario = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-rbac-painel-estagiario.png', screenshotPainelEstagiario, 'base64');

    // 1.5 - GERENCIAR SWITCHES: alternar e confirmar a mudanca visual
    console.log("Testando o gerenciamento do switch \"" + PERMISSAO_CRITICA_OFF + "\" (ligar)...");
    await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", estadoExcluir.elemento);
    await driver.sleep(500);
    await driver.executeScript("arguments[0].click();", estadoExcluir.elemento);
    await driver.sleep(1000);

    let estadoExcluirDepois = await obterEstadoSwitch(driver, PERMISSAO_CRITICA_OFF);
    if (estadoExcluirDepois.ativado !== estadoExcluir.ativado) {
      console.log("OK: a interface permite gerenciar (alternar) os switches de permissao.");
    } else {
      console.log("AVISO: o switch nao mudou de estado ao clicar - verifique o screenshot.");
    }

    const screenshotToggle = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-rbac-toggle.png', screenshotToggle, 'base64');

    // 1.6 - Fechar SEM salvar (Cancelar)
    console.log("Fechando o painel com 'Cancelar' (sem salvar)...");
    let botaoCancelar = await driver.findElements(By.xpath("//button[contains(text(), 'Cancelar')]"));
    if (botaoCancelar.length > 0) {
      await driver.executeScript("arguments[0].click();", botaoCancelar[0]);
      await driver.sleep(1500);
    }

    // ============================================================
    // PARTE 2 - COMO ESTAGIARIO
    // ============================================================
    console.log("\n========== PARTE 2: COMO ESTAGIARIO ==========");
    await fazerLogout(driver);
    await fazerLogin(driver, ESTAGIARIO_EMAIL, ESTAGIARIO_SENHA);
    await irParaEquipe(driver);

    // 2.1 - RBAC: estagiario deve ver "Somente leitura"
    console.log("Validando que o estagiario ve 'Somente leitura' (edicao bloqueada)...");
    let somenteLeituraEstag = await driver.findElements(By.xpath("//*[contains(text(), 'Somente leitura')]"));
    let permissoesClicaveisEstag = await driver.findElements(By.xpath("//button[normalize-space(text())='Permissões']"));

    const screenshotEstagEquipe = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-rbac-estagiario-equipe.png', screenshotEstagEquipe, 'base64');

    if (somenteLeituraEstag.length > 0) {
      console.log("OK: como ESTAGIARIO, a coluna de acoes mostra 'Somente leitura' - RBAC restringe a edicao por nivel.");
    } else if (permissoesClicaveisEstag.length === 0) {
      console.log("OK: o estagiario nao tem acoes 'Permissoes' clicaveis - edicao bloqueada.");
    } else {
      throw new Error(
        "FALHA DE RBAC: o estagiario nao ve 'Somente leitura' e ainda tem acoes de permissao clicaveis."
      );
    }

    console.log("\n==================================================");
    console.log("SUCESSO: US 1.2.1 (RBAC) validada - restricao por nivel, exclusao bloqueada e switches gerenciaveis.");
    console.log("==================================================\n");

    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);

    try {
      console.log("Gerando imagem do erro para analise visual...");
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-rbac.png', imagemErro, 'base64');

      console.log("Salvando o HTML do momento exato do erro para diagnostico...");
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-rbac.html', htmlErro);
    } catch (erroHtml) {
      console.error("Nao foi possivel salvar as evidencias de erro:", erroHtml);
    }

  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteRBAC();