import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

// Dados de teste para preencher o formulário de contato.
const NOME = 'Visitante Teste Selenium';
const EMAIL = 'visitante.teste@example.com';
const TELEFONE = '(61) 98765-4321';
const MENSAGEM = 'Olá, gostaria de agendar uma consulta sobre um caso de direito civil. Mensagem gerada por teste automatizado.';

async function rodarTesteFormularioContato() {
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
    // ==========================================
    // 0 - ABRIR A PÁGINA PÚBLICA (LANDING)
    // ==========================================
    console.log("Abrindo a página pública do escritório...");
    await driver.get(process.env.TEST_URL || 'http://frontend:3000');
    await driver.wait(until.elementLocated(By.tagName('body')), 15000);
    await driver.sleep(2000);

    // ==========================================
    // 1 - CLICAR EM "CONTATO" NA NAVBAR
    // ==========================================
    console.log("Clicando em 'Contato' na navbar...");
    // O link de contato é uma âncora para #contato.
    let seletorLinkContato = By.xpath("//a[@href='#contato' and contains(text(), 'Contato')]");
    let linkContato = await driver.wait(until.elementLocated(seletorLinkContato), 15000);
    await driver.executeScript("arguments[0].click();", linkContato);
    await driver.sleep(2000);

    // Garante que a seção de contato está visível
    console.log("Aguardando a seção 'Entre em contato'...");
    let seletorSecao = By.xpath("//*[contains(text(), 'Nos mande uma mensagem')]");
    let secao = await driver.wait(until.elementLocated(seletorSecao), 15000);
    await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", secao);
    await driver.sleep(1500);

    // ==========================================
    // 2 - TESTAR A VALIDAÇÃO (tentar enviar vazio) — AC: validação de entrada
    // ==========================================
    console.log("Testando a validação: tentando enviar o formulário vazio...");
    // IMPORTANTE: a página tem 2 formulários. O de "Enviar Caso para Análise" tem
    // botão "Enviar para Análise"; o de Contato tem botão exatamente "Enviar".
    // Ancoramos no botão que NÃO contém "Análise" para não pegar o formulário errado.
    let seletorBotaoEnviar = By.xpath(
      "//button[@type='submit' and contains(., 'Enviar') and not(contains(., 'Análise'))]"
    );
    let botaoEnviar = await driver.wait(until.elementLocated(seletorBotaoEnviar), 10000);
    await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", botaoEnviar);
    await driver.sleep(500);
    await driver.executeScript("arguments[0].click();", botaoEnviar);
    await driver.sleep(1000);

    // Se a validação HTML5 funcionar, o formulário NÃO foi enviado: a tela de
    // sucesso ("Mensagem enviada!") não deve aparecer ainda.
    let sucessoPrematuro = await driver.findElements(By.xpath("//*[contains(text(), 'Mensagem enviada')]"));
    if (sucessoPrematuro.length === 0) {
      console.log("OK: o formulário vazio NÃO foi enviado — a validação dos campos obrigatórios está ativa.");
    } else {
      console.log("AVISO: o formulário foi enviado mesmo vazio — a validação pode não estar funcionando.");
    }

    // Confirma que ao menos um campo obrigatório está marcado como inválido
    let camposInvalidos = await driver.executeScript(`
      const form = document.querySelector('form');
      if (!form) return -1;
      const invalidos = form.querySelectorAll(':invalid');
      return invalidos.length;
    `);
    console.log(`Campos obrigatórios não preenchidos detectados pelo navegador: ${camposInvalidos}`);

    // ==========================================
    // 3 - PREENCHER OS CAMPOS OBRIGATÓRIOS — AC: nome, e-mail, telefone, mensagem
    // ==========================================
    console.log("Preenchendo os campos do formulário de contato...");

    // Os inputs do formulário de mensagem (na ordem: nome, email, telefone) + textarea.
    // Para evitar ambiguidade com o outro formulário da página ("Enviar Caso"),
    // trabalhamos a partir do form que contém o botão "Enviar" de mensagem.
    let formContato = await driver.findElement(
      By.xpath("//button[@type='submit' and contains(., 'Enviar') and not(contains(., 'Análise'))]/ancestor::form[1]")
    );

    let campoNome = await formContato.findElement(By.css('input[placeholder*="João Silva"]'));
    await campoNome.clear();
    await campoNome.sendKeys(NOME);

    let campoEmail = await formContato.findElement(By.css('input[type="email"]'));
    await campoEmail.clear();
    await campoEmail.sendKeys(EMAIL);

    // o telefone é o input de texto que não é o nome nem o email
    let inputsTexto = await formContato.findElements(By.css('input'));
    // percorre e acha o campo de telefone pelo placeholder
    for (let inp of inputsTexto) {
      let ph = await inp.getAttribute('placeholder');
      if (ph && ph.includes('98765')) {
        await inp.clear();
        await inp.sendKeys(TELEFONE);
      }
    }

    let campoMensagem = await formContato.findElement(By.css('textarea'));
    await campoMensagem.clear();
    await campoMensagem.sendKeys(MENSAGEM);

    await driver.sleep(500);

    console.log("Gerando evidência do formulário preenchido...");
    const screenshotPreenchido = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-contato-preenchido.png', screenshotPreenchido, 'base64');

    // ==========================================
    // 4 - ENVIAR E VALIDAR A CONFIRMAÇÃO
    // ==========================================
    console.log("Enviando o formulário preenchido...");
    botaoEnviar = await driver.findElement(seletorBotaoEnviar);
    await driver.executeScript("arguments[0].click();", botaoEnviar);
    await driver.sleep(2000);

    console.log("Verificando a mensagem de confirmação...");
    let confirmacao = await driver.findElements(By.xpath("//*[contains(text(), 'Mensagem enviada')]"));
    if (confirmacao.length > 0) {
      console.log("OK: o formulário foi enviado e a confirmação 'Mensagem enviada!' apareceu.");
    } else {
      throw new Error(
        "A confirmação 'Mensagem enviada!' não apareceu após o envio. Verifique o screenshot."
      );
    }

    console.log("Gerando evidência da confirmação de envio...");
    const screenshotConfirmacao = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-contato-enviado.png', screenshotConfirmacao, 'base64');

    console.log("\n==================================================");
    console.log("SUCESSO: US 3.2.1 validada (interface) — campos obrigatórios, validação e envio com confirmação.");
    console.log("OBS: a persistência na 'Caixa de Entrada de Leads' depende do backend e não é coberta por este teste de interface.");
    console.log("==================================================\n");

    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);

    try {
      console.log("Gerando imagem do erro para análise visual...");
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-contato.png', imagemErro, 'base64');

      console.log("Salvando o HTML do momento exato do erro para diagnóstico...");
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-contato.html', htmlErro);
    } catch (erroHtml) {
      console.error("Não foi possível salvar as evidências de erro:", erroHtml);
    }

  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteFormularioContato();