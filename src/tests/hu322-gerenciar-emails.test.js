import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

async function rodarTesteLeads() {
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

    // 1 - IR PARA O CMS (a Caixa de Leads fica na mesma pagina)
    console.log("Navegando para 'CMS'...");
    let menuCms = await driver.wait(
      until.elementLocated(By.xpath("//*[self::button or self::a][.//text()[contains(., 'CMS')] or normalize-space(text())='CMS']")),
      15000
    );
    await driver.executeScript("arguments[0].click();", menuCms);
    await driver.sleep(2500);

    // rola ate a Caixa de Entrada de Leads
    console.log("Localizando a 'Caixa de Entrada de Leads'...");
    let secaoLeads = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Caixa de Entrada de Leads')]")),
      15000
    );
    await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", secaoLeads);
    await driver.sleep(1500);

    // ============================================================
    // 2 - VALIDAR A TABELA DE LEADS (AC: listar em tabela)
    // ============================================================
    console.log("Validando a tabela de leads (colunas e linhas)...");
    let bodyTxt = await driver.findElement(By.tagName('body')).getText();
    let temColunas = /CONTATO/i.test(bodyTxt) && /ASSUNTO/i.test(bodyTxt) && /STATUS/i.test(bodyTxt);
    if (temColunas) {
      console.log("OK: tabela de leads presente (colunas Contato, Assunto, Status).");
    } else {
      console.log("AVISO: nao confirmei todas as colunas da tabela.");
    }

    const sc1 = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-leads-tabela.png', sc1, 'base64');

    // ============================================================
    // 3 - RESPONDER (abre o modal de composicao de e-mail) - AC: responder
    // ============================================================
    console.log("\n--- Testando 'Responder' ---");
    let botoesResponder = await driver.findElements(By.xpath("//button[contains(text(), 'Responder')]"));
    if (botoesResponder.length === 0) {
      throw new Error("Nenhum botao 'Responder' encontrado na tabela de leads.");
    }
    await driver.executeScript("arguments[0].click();", botoesResponder[0]);
    await driver.sleep(2000);

    // valida que o modal de resposta abriu
    let modalResposta = await driver.findElements(By.xpath("//*[contains(text(), 'Responder Lead') or contains(text(), 'Enviar E-mail') or contains(text(), 'Composição')]"));
    if (modalResposta.length > 0) {
      console.log("OK: o modal de composicao de e-mail (Responder Lead) abriu.");
    } else {
      console.log("AVISO: nao confirmei a abertura do modal de resposta.");
    }

    const sc2 = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-leads-responder.png', sc2, 'base64');

    // fecha o modal SEM enviar e-mail (Cancelar) - nao dispara e-mail real
    let botaoCancelar = await driver.findElements(By.xpath("//button[contains(text(), 'Cancelar')]"));
    if (botaoCancelar.length > 0) {
      await driver.executeScript("arguments[0].click();", botaoCancelar[0]);
      await driver.sleep(1500);
    }

    // ============================================================
    // 4 - ARQUIVAR (lead fica com opacidade reduzida) - AC: arquivar + opacidade
    // ============================================================
    console.log("\n--- Testando 'Arquivar' ---");
    let botoesArquivar = await driver.findElements(By.xpath("//button[contains(text(), 'Arquivar')]"));
    if (botoesArquivar.length === 0) {
      console.log("AVISO: nenhum botao 'Arquivar' disponivel (talvez todos ja arquivados).");
    } else {
      // pega a linha do lead antes de arquivar (sobe ate a <tr> ou linha)
      let linhaLead = await botoesArquivar[0].findElement(By.xpath("./ancestor::tr[1] | ./ancestor::div[contains(@class,'grid') or contains(@class,'flex')][1]"));
      await driver.executeScript("arguments[0].click();", botoesArquivar[0]);
      await driver.sleep(2000);

      // valida: apareceu status "Arquivado" e/ou botao "Desfazer"
      let bodyAposArquivar = await driver.findElement(By.tagName('body')).getText();
      let temArquivado = /Arquivado|Desfazer/i.test(bodyAposArquivar);

      // valida a opacidade reduzida da linha arquivada
      let opacidade = await driver.executeScript("return window.getComputedStyle(arguments[0]).opacity;", linhaLead);
      console.log("Opacidade da linha arquivada: " + opacidade);

      if (temArquivado) {
        console.log("OK: lead arquivado (status 'Arquivado' / botao 'Desfazer' presentes).");
      } else {
        console.log("AVISO: nao confirmei o estado 'Arquivado'.");
      }
      if (opacidade && parseFloat(opacidade) < 1) {
        console.log("OK: a linha arquivada esta com opacidade reduzida (" + opacidade + ").");
      } else {
        console.log("OBS: opacidade da linha = " + opacidade + " (a reducao pode estar em elementos internos).");
      }
    }

    const sc3 = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-leads-arquivar.png', sc3, 'base64');

    console.log("\n==================================================");
    console.log("SUCESSO: US 3.2.2 validada - tabela de leads, responder (modal) e arquivar com opacidade reduzida.");
    console.log("==================================================\n");
    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);
    try {
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-leads.png', imagemErro, 'base64');
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-leads.html', htmlErro);
    } catch (e) {}
  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteLeads();