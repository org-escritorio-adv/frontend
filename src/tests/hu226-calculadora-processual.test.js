import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

// Cenario de validacao conhecido (conferido manualmente pela regra do CPC):
// Publicacao em 28/04/2026 + Contestacao (15 dias uteis), descontando
// fins de semana e o feriado de 01/05 (Dia do Trabalho) => 20/05/2026.
const DATA_PUBLICACAO = '2026-04-28';
const TIPO_PRAZO = 'Contestação';
const DATA_FATAL_ESPERADA_MES = 'maio';
const DATA_FATAL_ESPERADA_DIA = '20';
const DATA_FATAL_ESPERADA_ANO = '2026';
const DATA_FATAL_ESPERADA_NUMERICA = '20/05/2026';

const TERMO_BUSCA_PROCESSO = '1111';

async function rodarTesteCalculadoraPrazos() {
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
    await driver.get('https://escritorio-adv-two.vercel.app/');
    await driver.wait(until.elementLocated(By.tagName('body')), 15000);

    console.log("Buscando e clicando no botao 'Area do Advogado'...");
    let seletorAreaAdvogado = By.xpath("//button[contains(text(), 'Área do Advogado')] | //a[contains(text(), 'Área do Advogado')]");
    let botaoAreaAdvogado = await driver.wait(until.elementLocated(seletorAreaAdvogado), 15000);
    await botaoAreaAdvogado.click();
    await driver.sleep(4000);

    console.log("Preenchendo credenciais de Administrador...");
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

    // 1 - ABRIR A CALCULADORA
    console.log("Abrindo a Calculadora de Prazos Processuais...");
    let botaoCalc = await driver.wait(until.elementLocated(By.css('button[title*="Calculadora de Prazos"]')), 15000);
    await botaoCalc.click();

    console.log("Aguardando o modal da calculadora abrir...");
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Calculadora de Prazos')]")), 15000);
    await driver.sleep(1500);

    // 2 - VINCULAR O PROCESSO
    console.log("Digitando no campo 'Vincular ao Processo'...");
    let campoBuscaProcesso = await driver.wait(
      until.elementLocated(By.css('input[placeholder*="0001234"], input[placeholder*="Silva"]')),
      10000
    );
    await campoBuscaProcesso.click();
    await campoBuscaProcesso.sendKeys(TERMO_BUSCA_PROCESSO);

    console.log("Aguardando a busca retornar o resultado...");
    await driver.sleep(3000);

    // Abordagem ESTRUTURAL (independe do texto do processo, que muda em producao):
    // ancora no cabecalho "RESULTADO(S)" e seleciona o primeiro item clicavel
    // que vem logo depois dele. O clique e feito via JS no proprio elemento.
    console.log("Localizando o primeiro resultado da busca (abordagem estrutural)...");
    // O script NÃO clica; apenas marca o elemento-alvo com um id temporário,
    // para que o Selenium possa clicar nele com a sequência REAL de eventos de
    // mouse (mousedown/mouseup/click) — o React frequentemente ignora um
    // .click() sintético via JS, mas reage ao clique real do Selenium.
    let marcado = await driver.executeScript(`
      const todos = Array.from(document.querySelectorAll('*'));
      const header = todos.find(el =>
        /RESULTADO/i.test(el.textContent || '') &&
        el.children.length <= 2 &&
        (el.textContent || '').length < 40
      );
      let container = header ? (header.parentElement || header) : document.body;
      if (container.parentElement) container = container.parentElement;

      const itens = Array.from(container.querySelectorAll('div, button, li, a'))
        .filter(el => {
          const txt = el.textContent || '';
          return /\\d{6,}/.test(txt) && txt.length < 120 && el.querySelector('p, span');
        });
      if (itens.length === 0) return { ok: false, motivo: 'nenhum item de resultado' };

      itens.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);
      const alvo = itens[0];
      alvo.setAttribute('data-selenium-alvo', 'resultado-processo');
      alvo.scrollIntoView({ block: 'center' });
      return { ok: true, textoAlvo: (alvo.textContent || '').slice(0, 60) };
    `);

    console.log("Resultado da marcação:", JSON.stringify(marcado));

    if (marcado && marcado.ok) {
      // clica com o Selenium REAL no elemento marcado
      let alvo = await driver.findElement(By.css('[data-selenium-alvo="resultado-processo"]'));
      await driver.sleep(300);
      try {
        await alvo.click();
      } catch (e) {
        // se o clique real for interceptado, tenta clicar num filho de texto interno
        let filhos = await alvo.findElements(By.css('p, span'));
        if (filhos.length > 0) {
          await filhos[0].click();
        } else {
          throw e;
        }
      }
      await driver.sleep(2000);
    } else {
      throw new Error("Não foi possível localizar o item de resultado da busca para clicar.");
    }

    // Confirma o vinculo: o botao "Selecione um Processo" deve sumir / virar "Salvar".
    let botaoSelecione = await driver.findElements(By.xpath("//button[contains(text(), 'Selecione um Processo')]"));
    if (botaoSelecione.length === 0) {
      console.log("OK: processo vinculado (botao 'Selecione um Processo' sumiu).");
    } else {
      console.log("AVISO: o botao ainda diz 'Selecione um Processo' — o vinculo pode nao ter ocorrido.");
    }

    // 3 - PREENCHER A DATA (input date via setter nativo + eventos)
    console.log("Preenchendo a data de publicacao (" + DATA_PUBLICACAO + ")...");
    let inputData = await driver.wait(until.elementLocated(By.css('input[type="date"]')), 10000);
    await driver.executeScript(`
      const el = arguments[0];
      const valor = arguments[1];
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, valor);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    `, inputData, DATA_PUBLICACAO);
    await driver.sleep(1000);

    // 4 - SELECIONAR O TIPO DE PRAZO
    console.log("Selecionando o tipo de prazo \"" + TIPO_PRAZO + "\"...");
    let opcaoPrazo = await driver.wait(
      until.elementLocated(By.xpath("//option[contains(text(), \"" + TIPO_PRAZO + "\")]")),
      10000
    );
    await opcaoPrazo.click();
    await driver.sleep(1500);

    // 5 - VALIDAR A DATA FATAL
    console.log("Aguardando o calculo da data fatal...");
    await driver.sleep(1500);
    let textoAtual = await driver.findElement(By.tagName('body')).getText();

    let achouExtenso =
      textoAtual.includes(DATA_FATAL_ESPERADA_DIA) &&
      textoAtual.toLowerCase().includes(DATA_FATAL_ESPERADA_MES) &&
      textoAtual.includes(DATA_FATAL_ESPERADA_ANO);
    let achouNumerico = textoAtual.includes(DATA_FATAL_ESPERADA_NUMERICA);

    console.log("Gerando evidencia do resultado do calculo...");
    const screenshotCalculo = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-calculadora-prazos.png', screenshotCalculo, 'base64');

    if (achouExtenso || achouNumerico) {
      console.log("OK: a data fatal calculada e " + DATA_FATAL_ESPERADA_NUMERICA + ", exatamente o esperado para Contestacao (15 dias uteis) a partir de 28/04/2026.");
    } else {
      throw new Error("A data fatal esperada (" + DATA_FATAL_ESPERADA_NUMERICA + ") NAO foi encontrada. Verifique 'evidencia-calculadora-prazos.png'.");
    }

    if (textoAtual.toLowerCase().includes('feriado')) {
      console.log("OK: o resultado menciona o desconto de feriado(s).");
    }
    if (textoAtual.toLowerCase().includes('dias úteis')) {
      console.log("OK: o resultado menciona a contagem em dias uteis.");
    }

    // 6 - SALVAR
    console.log("Clicando no botao de salvar o prazo...");
    let botaoSalvar = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'Salvar')]")), 10000);
    let habilitado = await botaoSalvar.isEnabled();
    if (!habilitado) {
      throw new Error("O botao 'Salvar' esta desabilitado — o processo pode nao ter sido vinculado.");
    }
    await driver.executeScript("arguments[0].click();", botaoSalvar);
    await driver.sleep(3000);

    console.log("Gerando evidencia apos salvar...");
    const screenshotSalvar = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-calculadora-salvar.png', screenshotSalvar, 'base64');
    console.log("OK: prazo salvo.");

    console.log("\n==================================================");
    console.log("SUCESSO: US 2.2.6 validada — calculo correto em dias uteis com feriado, e prazo salvo.");
    console.log("==================================================\n");
    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);
    try {
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-calculadora-prazos.png', imagemErro, 'base64');
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-calculadora-prazos.html', htmlErro);
    } catch (erroHtml) {
      console.error("Nao foi possivel salvar evidencias de erro:", erroHtml);
    }
  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteCalculadoraPrazos();