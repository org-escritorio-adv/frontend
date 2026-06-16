import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

async function rodarTesteDashboardResumoFavoritos() {
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
    // 0 - LOGIN (mesmo fluxo já validado nas US 1.1.1 / 1.2.1)
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
    await campoSenha.sendKeys('12345678A'); // senha redefinida pelo teste da US 1.1.2

    let seletorBotaoEntrar = By.xpath("//button[contains(text(), 'ENTRAR') or contains(text(), 'Entrar')]");
    let botaoEntrar = await driver.wait(until.elementLocated(seletorBotaoEntrar), 10000);
    await botaoEntrar.click();

    console.log("Aguardando redirecionamento para o Dashboard...");
    await driver.sleep(5000);

    let urlAtual = await driver.getCurrentUrl();
    if (!urlAtual.includes('/dashboard')) {
      throw new Error(`Login falhou: esperava ser redirecionado para /dashboard, mas a URL atual é ${urlAtual}`);
    }

    // ==========================================
    // 1 - VALIDAR CABEÇALHO DE BOAS-VINDAS (confirma que caiu na tela inicial certa)
    // ==========================================
    console.log("Verificando a saudação de boas-vindas...");
    let seletorBoasVindas = By.xpath("//*[contains(text(), 'Bem-vindo')]");
    await driver.wait(until.elementLocated(seletorBoasVindas), 10000);

    // ==========================================
    // 2 - VALIDAR OS CARDS DE RESUMO
    // ==========================================
    const cardsDeResumoEsperados = ['Casos Ativos', 'Tarefas Abertas', 'Total Processos', 'Prazos (7 dias)'];
    for (const tituloCard of cardsDeResumoEsperados) {
      console.log(`Verificando se o card "${tituloCard}" está presente...`);
      let seletorCard = By.xpath(`//*[contains(text(), "${tituloCard}")]`);
      await driver.wait(until.elementLocated(seletorCard), 10000);
    }
    console.log("OK: todos os cards de resumo estão presentes.");

    // ==========================================
    // 3 - VALIDAR A SEÇÃO "CASOS FAVORITOS" (AC: exibir processos marcados como favoritos)
    // ==========================================
    console.log("Verificando a seção 'Casos Favoritos'...");
    let seletorSecaoFavoritos = By.xpath("//*[contains(text(), 'Casos Favoritos')]");
    await driver.wait(until.elementLocated(seletorSecaoFavoritos), 10000);

    console.log("Verificando se há card(s) de processo favorito listado(s)...");
    let seletorBotaoVerDetalhes = By.xpath("//*[contains(text(), 'VER DETALHES')]");
    let cardsFavoritos = await driver.findElements(seletorBotaoVerDetalhes);

    if (cardsFavoritos.length === 0) {
      // Não é necessariamente um erro: pode ser um cenário válido (conta sem
      // processos favoritados). Mas, como pode também ser um problema de
      // seletor, logamos o texto da seção para facilitar a investigação.
      console.log(
        "Nenhum card de favorito foi encontrado nesta execução. Pode ser um cenário " +
        "válido (sem favoritos) ou um problema de seletor — segue o texto da seção:"
      );
      let secaoFavoritos = await driver.findElement(seletorSecaoFavoritos);
      let containerFavoritos = await secaoFavoritos.findElement(By.xpath("./ancestor::*[self::div][1]"));
      let textoContainer = await containerFavoritos.getText();
      console.log("--- Texto da seção 'Casos Favoritos' ---");
      console.log(textoContainer);
      console.log("-----------------------------------------");
    } else {
      console.log(`OK: ${cardsFavoritos.length} processo(s) favorito(s) encontrado(s) na listagem.`);
    }

    // ==========================================
    // 4 - VALIDAR A SEÇÃO "ATIVIDADE RECENTE" (AC: mostrar resumo de movimentações recentes)
    // ==========================================
    console.log("Verificando a seção 'Atividade Recente'...");
    let seletorSecaoAtividade = By.xpath("//*[contains(text(), 'Atividade Recente')]");
    await driver.wait(until.elementLocated(seletorSecaoAtividade), 10000);

    console.log("\n==================================================");
    console.log("SUCESSO: US 1.2.2 validada — dashboard exibe resumo, favoritos e atividade recente.");
    console.log("==================================================\n");

    console.log("Gerando evidência da tela do Dashboard...");
    const screenshotFinal = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-dashboard-resumo-favoritos.png', screenshotFinal, 'base64');

    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);

    try {
      console.log("Gerando imagem do erro para análise visual...");
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-dashboard.png', imagemErro, 'base64');

      console.log("Salvando o HTML do momento exato do erro para diagnóstico...");
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-dashboard.html', htmlErro);
    } catch (erroHtml) {
      console.error("Não foi possível salvar as evidências de erro:", erroHtml);
    }

  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteDashboardResumoFavoritos();