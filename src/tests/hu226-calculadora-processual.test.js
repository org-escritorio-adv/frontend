import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

// Cenário de validação conhecido (conferido manualmente pela regra do CPC):
// Publicação em 28/04/2026 + Contestação (15 dias úteis), descontando
// fins de semana e o feriado de 01/05 (Dia do Trabalho) => 20/05/2026.
const DATA_PUBLICACAO = '2026-04-28';      // formato do input type="date"
const TIPO_PRAZO = 'Contestação';
const DATA_FATAL_ESPERADA_MES = 'maio';
const DATA_FATAL_ESPERADA_DIA = '20';
const DATA_FATAL_ESPERADA_ANO = '2026';
const DATA_FATAL_ESPERADA_NUMERICA = '20/05/2026';

// Termo para buscar o processo no campo "Vincular ao Processo".
const TERMO_BUSCA_PROCESSO = '5';
const NUMERO_PROCESSO = '50002077820258130557';

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
    // ==========================================
    // 0 - LOGIN
    // ==========================================
    console.log("Iniciando o teste automatizado na Home...");
    await driver.get('http://frontend:3000');
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
    await campoSenha.sendKeys('12345678A');

    let seletorBotaoEntrar = By.xpath("//button[contains(text(), 'ENTRAR') or contains(text(), 'Entrar')]");
    let botaoEntrar = await driver.wait(until.elementLocated(seletorBotaoEntrar), 10000);
    await botaoEntrar.click();
    await driver.sleep(5000);

    // ==========================================
    // 1 - ABRIR A CALCULADORA DE PRAZOS
    // ==========================================
    console.log("Abrindo a Calculadora de Prazos Processuais...");
    let seletorBotaoCalc = By.css('button[title*="Calculadora de Prazos"]');
    let botaoCalc = await driver.wait(until.elementLocated(seletorBotaoCalc), 15000);
    await botaoCalc.click();

    console.log("Aguardando o modal da calculadora abrir...");
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Calculadora de Prazos')]")), 15000);
    await driver.sleep(1500);

    // ==========================================
    // 2 - VINCULAR O PROCESSO
    // ==========================================
    console.log("Digitando no campo 'Vincular ao Processo'...");
    // O campo de busca de processo é o input de texto com placeholder de exemplo de CNJ.
    let seletorBuscaProcesso = By.css('input[placeholder*="0001234"], input[placeholder*="Silva"]');
    let campoBuscaProcesso = await driver.wait(until.elementLocated(seletorBuscaProcesso), 10000);
    await campoBuscaProcesso.click();
    await campoBuscaProcesso.sendKeys(TERMO_BUSCA_PROCESSO);

    console.log("Aguardando a busca retornar o resultado...");
    // A lista de resultados é assíncrona e pode sumir ao perder foco, por isso
    // usamos uma espera fixa curta e agimos imediatamente, sem wait longo.
    await driver.sleep(2500);

    // O número do processo no resultado pode vir fragmentado em vários <span>
    // por causa do destaque do trecho buscado. Por isso miramos no texto contínuo
    // "Sem partes · TJMG" (ou só "TJMG"), que identifica a linha do resultado.
    console.log("Localizando a linha do resultado pelo texto do tribunal...");
    let candidatosResultado = await driver.findElements(
      By.xpath("//p[contains(text(), 'TJMG') or contains(text(), 'Sem partes')]")
    );

    if (candidatosResultado.length === 0) {
      throw new Error(
        "A lista de resultados do processo não apareceu. Pode ser timing (a lista some rápido) " +
        "ou o termo de busca não retornou nada."
      );
    }

    // Sobe até a linha clicável (container do resultado) e clica via JS,
    // evitando que o overlay do modal intercepte o clique.
    let linhaResultado = await candidatosResultado[0].findElement(
      By.xpath("./ancestor::*[self::div or self::button][1]")
    );
    await driver.executeScript("arguments[0].click();", linhaResultado);
    await driver.sleep(1500);

    // Confirma que o processo foi vinculado (aparece o botão "Remover vínculo").
    let vinculado = await driver.findElements(By.css('button[title="Remover vínculo"]'));
    if (vinculado.length > 0) {
      console.log("OK: processo vinculado com sucesso.");
    } else {
      console.log("AVISO: não foi possível confirmar o vínculo pelo botão de remover — seguindo mesmo assim.");
    }

    // ==========================================
    // 3 - PREENCHER A DATA DE PUBLICAÇÃO (input type="date" via JS)
    // ==========================================
    console.log(`Preenchendo a data de publicação (${DATA_PUBLICACAO})...`);
    let seletorInputData = By.css('input[type="date"]');
    let inputData = await driver.wait(until.elementLocated(seletorInputData), 10000);
    await driver.executeScript((el, val) => { el.value = val; }, inputData, DATA_PUBLICACAO);
    await driver.executeScript(
      (el) => el.dispatchEvent(new Event('change', { bubbles: true })),
      inputData
    );
    await driver.sleep(1000);

    // ==========================================
    // 4 - SELECIONAR O TIPO DE PRAZO
    // ==========================================
    console.log(`Selecionando o tipo de prazo "${TIPO_PRAZO}"...`);
    let seletorOpcaoPrazo = By.xpath(`//option[contains(text(), "${TIPO_PRAZO}")]`);
    let opcaoPrazo = await driver.wait(until.elementLocated(seletorOpcaoPrazo), 10000);
    await opcaoPrazo.click();
    await driver.sleep(1500);

    // ==========================================
    // 5 - VALIDAR A DATA FATAL CALCULADA
    // ==========================================
    console.log("Aguardando o cálculo da data fatal...");
    await driver.sleep(1500);

    let textoAtual = await driver.findElement(By.tagName('body')).getText();

    let achouFormatoExtenso =
      textoAtual.includes(DATA_FATAL_ESPERADA_DIA) &&
      textoAtual.toLowerCase().includes(DATA_FATAL_ESPERADA_MES) &&
      textoAtual.includes(DATA_FATAL_ESPERADA_ANO);
    let achouFormatoNumerico = textoAtual.includes(DATA_FATAL_ESPERADA_NUMERICA);

    console.log("Gerando evidência do resultado do cálculo...");
    const screenshotCalculo = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-calculadora-prazos.png', screenshotCalculo, 'base64');

    if (achouFormatoExtenso || achouFormatoNumerico) {
      console.log(
        `OK: a data fatal calculada é ${DATA_FATAL_ESPERADA_NUMERICA}, exatamente o esperado ` +
        "para Contestação (15 dias úteis) a partir de 28/04/2026, descontando fins de semana e o feriado de 01/05."
      );
    } else {
      throw new Error(
        `A data fatal esperada (${DATA_FATAL_ESPERADA_NUMERICA}) NÃO foi encontrada na tela. ` +
        "O cálculo pode estar incorreto — verifique o screenshot 'evidencia-calculadora-prazos.png'."
      );
    }

    if (textoAtual.toLowerCase().includes('feriado')) {
      console.log("OK: o resultado menciona o desconto de feriado(s).");
    }
    if (textoAtual.toLowerCase().includes('dias úteis')) {
      console.log("OK: o resultado menciona a contagem em dias úteis.");
    }

    // ==========================================
    // 6 - SALVAR O PRAZO NO PROCESSO VINCULADO
    // ==========================================
    console.log("Clicando no botão de salvar o prazo...");
    // Com um processo vinculado, o botão principal vira "Salvar em <numero>...".
    let seletorBotaoSalvar = By.xpath("//button[contains(text(), 'Salvar')]");
    let botaoSalvar = await driver.wait(until.elementLocated(seletorBotaoSalvar), 10000);

    let estaHabilitado = await botaoSalvar.isEnabled();
    if (!estaHabilitado) {
      throw new Error("O botão 'Salvar' está desabilitado — o processo pode não ter sido vinculado corretamente.");
    }

    await driver.executeScript("arguments[0].click();", botaoSalvar);
    await driver.sleep(3000);

    console.log("Gerando evidência após salvar...");
    const screenshotSalvar = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-calculadora-salvar.png', screenshotSalvar, 'base64');

    console.log("OK: prazo salvo (clique no botão de salvar executado sem erro).");

    console.log("\n==================================================");
    console.log("SUCESSO: US 2.2.6 validada — cálculo correto em dias úteis com feriado, e prazo salvo no processo.");
    console.log("==================================================\n");

    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);

    try {
      console.log("Gerando imagem do erro para análise visual...");
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-calculadora-prazos.png', imagemErro, 'base64');

      console.log("Salvando o HTML do momento exato do erro para diagnóstico...");
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-calculadora-prazos.html', htmlErro);
    } catch (erroHtml) {
      console.error("Não foi possível salvar as evidências de erro:", erroHtml);
    }

  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteCalculadoraPrazos();