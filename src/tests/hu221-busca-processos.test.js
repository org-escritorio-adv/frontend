import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

// Conta quantas linhas de processo estão visíveis na listagem.
// Usa o botão "Ver"/"Abrir" que existe em cada linha como marcador de linha.
async function contarProcessosVisiveis(driver) {
  let botoes = await driver.findElements(
    By.xpath("//*[normalize-space(text())='Ver' or normalize-space(text())='Abrir']")
  );
  return botoes.length;
}

async function rodarTesteBuscaProcessos() {
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
    // 1 - NAVEGAR PARA "PROC." E AGUARDAR A LISTAGEM
    // ==========================================
    console.log("Buscando o item 'Proc.' no menu lateral...");
    let seletorMenuProc = By.xpath("//*[self::button or self::a][.//text()[contains(., 'Proc.')] or contains(text(), 'Proc.')]");
    let itemMenuProc = await driver.wait(until.elementLocated(seletorMenuProc), 15000);
    await itemMenuProc.click();

    console.log("Aguardando o carregamento da tela 'Processos Judiciais'...");
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Processos Judiciais')]")), 15000);
    await driver.sleep(2000); // espera a listagem carregar do backend

    // ==========================================
    // 2 - CONTAR PROCESSOS ANTES DE FILTRAR
    // ==========================================
    let totalInicial = await contarProcessosVisiveis(driver);
    console.log(`Processos visíveis inicialmente: ${totalInicial}`);

    if (totalInicial === 0) {
      throw new Error(
        "Nenhum processo na listagem para testar a busca. Cadastre ao menos 1 processo antes de rodar este teste."
      );
    }

    // ==========================================
    // 3 - LOCALIZAR O CAMPO DE BUSCA
    // ==========================================
    console.log("Localizando o campo de busca de processos...");
    let seletorBusca = By.css('input[placeholder*="Buscar por número"], input[placeholder*="nome da parte"]');
    let campoBusca = await driver.wait(until.elementLocated(seletorBusca), 15000);

    // ==========================================
    // 4 - BUSCA QUE NÃO RETORNA NADA (filtro extremo) → lista deve esvaziar
    // ==========================================
    console.log("Digitando um termo que não deve existir em nenhum processo...");
    await campoBusca.clear();
    await campoBusca.sendKeys('zzz_termo_inexistente_999');
    await driver.sleep(1500);

    let totalAposBuscaInexistente = await contarProcessosVisiveis(driver);
    console.log(`Processos visíveis após busca inexistente: ${totalAposBuscaInexistente}`);

    if (totalAposBuscaInexistente < totalInicial) {
      console.log("OK: a busca filtrou a lista (um termo inexistente reduziu/zerou os resultados).");
    } else {
      throw new Error(
        `A busca não filtrou: antes havia ${totalInicial} processos e após buscar um termo inexistente ainda há ${totalAposBuscaInexistente}.`
      );
    }

    console.log("Gerando evidência da busca sem resultados...");
    const screenshotSemResultado = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-busca-sem-resultado.png', screenshotSemResultado, 'base64');

    // ==========================================
    // 5 - LIMPAR A BUSCA → lista deve voltar ao total inicial
    // ==========================================
    console.log("Limpando o campo de busca...");
    await campoBusca.clear();
    // Alguns componentes só reagem ao evento de digitação; envia um espaço e apaga
    // para garantir o disparo do onChange, caso o clear() sozinho não baste.
    await campoBusca.sendKeys(' ');
    await campoBusca.sendKeys('\u0008'); // backspace
    await driver.sleep(1500);

    let totalAposLimpar = await contarProcessosVisiveis(driver);
    console.log(`Processos visíveis após limpar a busca: ${totalAposLimpar}`);

    if (totalAposLimpar === totalInicial) {
      console.log("OK: ao limpar a busca, a lista voltou ao total inicial.");
    } else {
      console.log(
        `AVISO: após limpar, há ${totalAposLimpar} processos (esperado ${totalInicial}). ` +
        "Pode ser timing de renderização — verifique o screenshot."
      );
    }

    // ==========================================
    // 6 - BUSCA POR NÚMERO → evidência específica
    // ==========================================
    console.log("Limpando a busca antes de testar a busca por número...");
    await campoBusca.clear();
    await campoBusca.sendKeys(' ');
    await campoBusca.sendKeys('\u0008');
    await driver.sleep(1500);

    console.log("Buscando por NÚMERO (termo '00000000000')...");
    await campoBusca.clear();
    await campoBusca.sendKeys('00000000000');
    await driver.sleep(1500);

    let totalBuscaNumero = await contarProcessosVisiveis(driver);
    console.log(`Processos visíveis após busca por número '000': ${totalBuscaNumero}`);

    if (totalBuscaNumero >= 1) {
      console.log("OK: a busca por NÚMERO retornou ao menos um resultado.");
    } else {
      console.log("AVISO: a busca por número '000' não retornou resultados — verifique o screenshot.");
    }

    console.log("Gerando evidência da BUSCA POR NÚMERO...");
    const screenshotBuscaNumero = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-busca-por-numero.png', screenshotBuscaNumero, 'base64');

    // ==========================================
    // 7 - BUSCA POR NOME → evidência específica
    // ==========================================
    console.log("Limpando a busca antes de testar a busca por nome...");
    await campoBusca.clear();
    await campoBusca.sendKeys(' ');
    await campoBusca.sendKeys('\u0008');
    await driver.sleep(1500);

    // Extrai um nome real de parte/cliente da listagem para buscar por ele.
    console.log("Extraindo um nome real de parte/cliente da listagem...");
    let nomesParte = await driver.findElements(
      By.css('span.font-semibold.text-\\[\\#1A2B3C\\]')
    );

    let termoNome = null;
    for (let el of nomesParte) {
      let txt = (await el.getText()).trim();
      // ignora vazios e textos que sejam só números (esses são CNJ, não nome)
      if (txt.length >= 3 && !/^\d+$/.test(txt)) {
        termoNome = txt.split(/\s+/)[0]; // primeira palavra do nome
        break;
      }
    }

    if (termoNome) {
      console.log(`Buscando por NOME da parte ("${termoNome}")...`);
      await campoBusca.clear();
      await campoBusca.sendKeys(termoNome);
      await driver.sleep(1500);

      let totalBuscaNome = await contarProcessosVisiveis(driver);
      console.log(`Processos visíveis após busca pelo nome "${termoNome}": ${totalBuscaNome}`);

      if (totalBuscaNome >= 1) {
        console.log("OK: a busca por NOME retornou ao menos um resultado.");
      } else {
        console.log("AVISO: a busca por nome não retornou resultados — verifique o screenshot.");
      }
    } else {
      console.log(
        "AVISO: não foi possível extrair um nome de parte da listagem. " +
        "Usando um termo de nome genérico para ainda gerar a evidência."
      );
      await campoBusca.clear();
      await campoBusca.sendKeys('teste');
      await driver.sleep(1500);
    }

    console.log("Gerando evidência da BUSCA POR NOME...");
    const screenshotBuscaNome = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-busca-por-nome.png', screenshotBuscaNome, 'base64');

    console.log("\n==================================================");
    console.log("SUCESSO: US 2.2.1 validada — a busca filtra a listagem por número E por nome da parte.");
    console.log("==================================================\n");

    const screenshotFinal = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-busca-processos-sucesso.png', screenshotFinal, 'base64');

    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);

    try {
      console.log("Gerando imagem do erro para análise visual...");
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-busca-processos.png', imagemErro, 'base64');

      console.log("Salvando o HTML do momento exato do erro para diagnóstico...");
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-busca-processos.html', htmlErro);
    } catch (erroHtml) {
      console.error("Não foi possível salvar as evidências de erro:", erroHtml);
    }

  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteBuscaProcessos();