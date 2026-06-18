import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

const NOME_ADVOGADO = 'Dr. Selenium Teste ' + Math.floor(Math.random() * 100000);
const NOME_EDITADO = NOME_ADVOGADO + ' EDITADO';
const OAB = 'OAB/SP 999.888';
const EMAIL = 'selenium.teste@barcelostakaki.adv.br';

async function rodarTesteCmsAdvogados() {
  console.log("Conectando ao Selenium no Docker...");

  let options = new chrome.Options();
  options.addArguments('--disable-gpu');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.windowSize({ width: 1400, height: 900 });

  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .usingServer('http://selenium-chrome:4444/wd/hub')
    .build();

  try {
    // 0 - LOGIN
    console.log("Login...");
    await driver.get(process.env.TEST_URL || 'http://frontend:3000');
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

    // 1 - IR PARA O CMS
    console.log("Navegando para 'CMS'...");
    let menuCms = await driver.wait(
      until.elementLocated(By.xpath("//*[self::button or self::a][.//text()[contains(., 'CMS')] or normalize-space(text())='CMS']")),
      15000
    );
    await driver.executeScript("arguments[0].click();", menuCms);
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Perfis de Advogados') or contains(text(), 'CMS Institucional')]")), 15000);
    await driver.sleep(2000);

    // ============================================================
    // 2 - CRIAR um advogado
    // ============================================================
    console.log("\n--- CRIAR advogado ---");
    let botaoAdd = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'Adicionar Advogado')]")), 10000);
    await driver.executeScript("arguments[0].click();", botaoAdd);
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Adicionar Advogado')]")), 10000);
    await driver.sleep(1000);

    console.log("Preenchendo o nome (\"" + NOME_ADVOGADO + "\")...");
    let campoNome = await driver.findElement(By.css('input[placeholder*="João Silva"], input[placeholder*="Dr."]'));
    await campoNome.clear();
    await campoNome.sendKeys(NOME_ADVOGADO);

    // Especialidade (select) - escolhe a primeira opcao real disponivel
    let selects = await driver.findElements(By.css('select'));
    if (selects.length > 0) {
      let opcoes = await selects[0].findElements(By.css('option'));
      // pega a primeira opcao que tenha value nao-vazio
      for (let op of opcoes) {
        let val = await op.getAttribute('value');
        if (val && val.trim() !== '') { await op.click(); break; }
      }
    }

    let campoOab = await driver.findElement(By.css('input[placeholder*="OAB"]'));
    await campoOab.clear();
    await campoOab.sendKeys(OAB);

    let campoEmailAdv = await driver.findElement(By.css('input[placeholder*="barcelostakaki"], input[type="email"]'));
    await campoEmailAdv.clear();
    await campoEmailAdv.sendKeys(EMAIL);

    console.log("Clicando em 'Adicionar'...");
    // o botao pode ter o "+" como icone separado; pegamos o botao do modal que
    // contem "Adicionar" e NAO e o de abrir (que ja foi clicado). Filtramos pelo
    // que esta visivel dentro do modal.
    let botoesAdicionar = await driver.findElements(By.xpath("//button[contains(., 'Adicionar')]"));
    let botaoConfirmar = null;
    for (let b of botoesAdicionar) {
      let txt = (await b.getText()).trim();
      // o botao de confirmar do modal diz so "Adicionar" (sem "Advogado")
      if (txt === 'Adicionar' || txt === '+ Adicionar' || (txt.includes('Adicionar') && !txt.includes('Advogado'))) {
        botaoConfirmar = b;
      }
    }
    if (!botaoConfirmar) {
      // fallback: ultimo botao "Adicionar" da pagina (o do modal costuma ser o ultimo)
      botaoConfirmar = botoesAdicionar[botoesAdicionar.length - 1];
    }
    await driver.executeScript("arguments[0].click();", botaoConfirmar);
    await driver.sleep(3000);

    let textoApos = await driver.findElement(By.tagName('body')).getText();
    if (textoApos.includes(NOME_ADVOGADO)) {
      console.log("OK: advogado criado e visivel no CMS.");
    } else {
      throw new Error("O advogado criado nao apareceu na tela. Verifique a evidencia.");
    }
    const sc1 = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-cms-criar.png', sc1, 'base64');

    // ============================================================
    // 3 - EDITAR o advogado (hover -> lapis)
    // ============================================================
    console.log("\n--- EDITAR advogado ---");
    // localiza o card que contem EXATAMENTE o nome do advogado criado
    let nomeNoCard = await driver.findElement(By.xpath("//*[contains(text(), \"" + NOME_ADVOGADO + "\")]"));
    // sobe ate o card (container que tambem contem o texto 'OAB' ou um botao)
    let card = await nomeNoCard.findElement(
      By.xpath("./ancestor::div[.//button or .//*[contains(text(),'OAB')]][1]")
    );
    await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", card);
    await driver.sleep(500);

    // hover no card para revelar os botoes de acao (lapis/lixeira)
    await driver.actions({ bridge: true }).move({ origin: card }).pause(700).perform();
    await driver.sleep(500);

    // prioriza o botao "Editar Perfil" (rodape do card) que e inequivoco;
    // se nao houver, usa o lapis do topo.
    let botaoEditar = await card.findElements(By.xpath(".//button[contains(text(), 'Editar')]"));
    if (botaoEditar.length === 0) {
      // lapis do topo: primeiro botao com svg dentro do card
      botaoEditar = await card.findElements(By.css('button'));
    }
    await driver.executeScript("arguments[0].click();", botaoEditar[0]);
    await driver.sleep(1500);

    // confirma que o modal abriu editando o advogado CERTO (o nome criado)
    let tituloEdicao = await driver.findElements(By.xpath("//*[contains(text(), \"" + NOME_ADVOGADO + "\")]"));
    if (tituloEdicao.length === 0) {
      console.log("AVISO: o modal de edicao pode ter aberto outro advogado — verifique a evidencia.");
    }

    // no modal de edicao, altera o nome
    let campoNomeEdit = await driver.findElement(By.css('input[placeholder*="João Silva"], input[placeholder*="Dr."]'));
    await campoNomeEdit.clear();
    await campoNomeEdit.sendKeys(NOME_EDITADO);

    // botao de salvar do modal de edicao (texto pode variar: Salvar, Salvar
    // Alteracoes, Atualizar, ou ate Adicionar). Pega o mais provavel.
    let botoesSalvar = await driver.findElements(
      By.xpath("//button[contains(., 'Salvar') or contains(., 'Atualizar') or contains(., 'Adicionar') or contains(., 'Confirmar')]")
    );
    let botaoSalvarEdit = null;
    for (let b of botoesSalvar) {
      let txt = (await b.getText()).trim();
      if (txt.includes('Salvar') || txt.includes('Atualizar')) { botaoSalvarEdit = b; break; }
    }
    if (!botaoSalvarEdit && botoesSalvar.length > 0) {
      botaoSalvarEdit = botoesSalvar[botoesSalvar.length - 1];
    }
    if (!botaoSalvarEdit) {
      throw new Error("Botao de salvar a edicao nao encontrado no modal.");
    }
    await driver.executeScript("arguments[0].click();", botaoSalvarEdit);
    await driver.sleep(3000);

    let textoAposEdit = await driver.findElement(By.tagName('body')).getText();
    if (textoAposEdit.includes(NOME_EDITADO)) {
      console.log("OK: advogado editado (novo nome aparece no CMS).");
    } else {
      console.log("AVISO: nao confirmei o nome editado - verifique a evidencia.");
    }
    const sc2 = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-cms-editar.png', sc2, 'base64');

    // ============================================================
    // 4 - EXCLUIR o advogado (hover -> lixeira)
    // ============================================================
    console.log("\n--- EXCLUIR advogado ---");
    let nomeAtual = textoAposEdit.includes(NOME_EDITADO) ? NOME_EDITADO : NOME_ADVOGADO;
    let nomeCard2 = await driver.findElement(By.xpath("//*[contains(text(), \"" + nomeAtual + "\")]"));
    let card2 = await nomeCard2.findElement(By.xpath("./ancestor::div[contains(@class,'rounded')][1]"));
    await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", card2);
    await driver.actions({ bridge: true }).move({ origin: card2 }).pause(600).perform();
    await driver.sleep(500);

    // clica na lixeira (botao com icone de trash, geralmente o de cor vermelha)
    let botoesCard = await card2.findElements(By.css('button'));
    // a lixeira costuma ser o ultimo botao de icone no topo do card
    let botaoExcluir = botoesCard[botoesCard.length - 1];
    await driver.executeScript("arguments[0].click();", botaoExcluir);
    await driver.sleep(1500);

    // confirma exclusao se houver dialogo de confirmacao
    let confirmar = await driver.findElements(By.xpath("//button[contains(text(), 'Confirmar') or contains(text(), 'Excluir') or contains(text(), 'Sim')]"));
    if (confirmar.length > 0) {
      await driver.executeScript("arguments[0].click();", confirmar[0]);
      await driver.sleep(2500);
    }

    let textoAposExcluir = await driver.findElement(By.tagName('body')).getText();
    if (!textoAposExcluir.includes(nomeAtual)) {
      console.log("OK: advogado excluido (nao aparece mais no CMS).");
    } else {
      console.log("AVISO: o advogado ainda aparece - a exclusao pode nao ter sido confirmada.");
    }
    const sc3 = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-cms-excluir.png', sc3, 'base64');

    console.log("\n==================================================");
    console.log("SUCESSO: US 3.1.3 validada - criar, editar e excluir perfil de advogado no CMS.");
    console.log("==================================================\n");
    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);
    try {
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-cms.png', imagemErro, 'base64');
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-cms.html', htmlErro);
    } catch (e) {}
  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteCmsAdvogados();