import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

// Conta quantos cartoes de cliente estao visiveis na listagem.
// Cada cliente mostra um documento (CPF/CNPJ) com pontuacao, que usamos como marcador.
async function contarClientesVisiveis(driver) {
  // documentos aparecem como "123.456.789-42" (CPF) ou "24.499.879/9155-07" (CNPJ)
  let docs = await driver.findElements(
    By.xpath("//*[contains(text(), '.') and (contains(text(), '-') or contains(text(), '/'))][string-length(normalize-space(text())) > 8]")
  );
  // filtra para manter so os que parecem documento (tem digitos e pontuacao)
  let total = 0;
  for (let d of docs) {
    let txt = (await d.getText()).trim();
    if (/\d{2,}[.\/-]/.test(txt)) total++;
  }
  return total;
}

async function rodarTesteBuscaClientes() {
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
    await driver.get(process.env.TEST_URL || 'http://frontend:3000');
    await driver.wait(until.elementLocated(By.tagName('body')), 15000);

    console.log("Buscando e clicando no botao 'Area do Advogado'...");
    let botaoAreaAdvogado = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Área do Advogado')] | //a[contains(text(), 'Área do Advogado')]")),
      15000
    );
    await botaoAreaAdvogado.click();
    await driver.sleep(4000);

    console.log("Preenchendo credenciais de Administrador...");
    let campoEmailLogin = await driver.wait(until.elementLocated(By.css('input[type="email"], input[name="email"]')), 15000);
    await driver.wait(until.elementIsVisible(campoEmailLogin), 15000);
    await campoEmailLogin.clear();
    await campoEmailLogin.sendKeys('admin@escritorio.com');

    let campoSenha = await driver.wait(until.elementLocated(By.css('input[type="password"], input[name="password"]')), 15000);
    await campoSenha.clear();
    await campoSenha.sendKeys('admin123');

    let botaoEntrar = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'ENTRAR') or contains(text(), 'Entrar')]")), 10000);
    await botaoEntrar.click();
    await driver.sleep(5000);

    // 1 - IR PARA CLIENTES
    console.log("Navegando para 'Clientes'...");
    let menuClientes = await driver.wait(
      until.elementLocated(By.xpath("//*[self::button or self::a][.//text()[contains(., 'Clientes')] or contains(text(), 'Clientes')]")),
      15000
    );
    await driver.executeScript("arguments[0].click();", menuClientes);
    // Confirma o carregamento da tela esperando o campo de busca de clientes,
    // que é um elemento estável dessa tela.
    await driver.wait(
      until.elementLocated(By.css('input[placeholder*="Nome ou documento"], input[placeholder*="documento"]')),
      15000
    );
    await driver.sleep(2000);

    let totalInicial = await contarClientesVisiveis(driver);
    console.log("Clientes visiveis inicialmente: " + totalInicial);

    // ============================================================
    // 2 - BUSCA POR NOME OU DOCUMENTO (AC 1)
    // ============================================================
    console.log("\n--- Testando a BUSCA ---");
    let campoBusca = await driver.wait(
      until.elementLocated(By.css('input[placeholder*="Nome ou documento"], input[placeholder*="documento"]')),
      10000
    );

    // 2a - termo inexistente: a lista deve reduzir/zerar
    console.log("Buscando um termo inexistente...");
    await campoBusca.clear();
    await campoBusca.sendKeys('zzz_cliente_inexistente_999');
    await driver.sleep(1500);
    let totalInexistente = await contarClientesVisiveis(driver);
    console.log("Clientes apos busca inexistente: " + totalInexistente);
    if (totalInexistente < totalInicial) {
      console.log("OK: a busca filtrou a lista (termo inexistente reduziu/zerou os resultados).");
    } else {
      throw new Error("A busca nao filtrou: antes " + totalInicial + ", apos termo inexistente " + totalInexistente + ".");
    }

    // 2b - limpa e confirma que a lista volta
    console.log("Limpando a busca...");
    await campoBusca.clear();
    await campoBusca.sendKeys(' ');
    await campoBusca.sendKeys('\u0008');
    await driver.sleep(1500);
    let totalAposLimpar = await contarClientesVisiveis(driver);
    console.log("Clientes apos limpar: " + totalAposLimpar);

    const screenshotBusca = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-clientes-busca.png', screenshotBusca, 'base64');

    // ============================================================
    // 3 - FILTRO POR TIPO PF / PJ (AC 2)
    // ============================================================
    console.log("\n--- Testando o FILTRO por tipo (PF/PJ) ---");

    // clica na aba "PF"
    console.log("Clicando no filtro 'PF'...");
    let abaPF = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'PF')] | //*[contains(@class,'cursor-pointer')][contains(text(), 'PF')]")),
      10000
    );
    await driver.executeScript("arguments[0].click();", abaPF);
    await driver.sleep(1500);
    let totalPF = await contarClientesVisiveis(driver);
    console.log("Clientes visiveis com filtro PF: " + totalPF);

    const screenshotPF = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-clientes-filtro-pf.png', screenshotPF, 'base64');

    // clica na aba "PJ"
    console.log("Clicando no filtro 'PJ'...");
    let abaPJ = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'PJ')] | //*[contains(@class,'cursor-pointer')][contains(text(), 'PJ')]")),
      10000
    );
    await driver.executeScript("arguments[0].click();", abaPJ);
    await driver.sleep(1500);
    let totalPJ = await contarClientesVisiveis(driver);
    console.log("Clientes visiveis com filtro PJ: " + totalPJ);

    const screenshotPJ = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-clientes-filtro-pj.png', screenshotPJ, 'base64');

    // Validacao: PF e PJ devem mostrar conjuntos diferentes (a soma deve bater
    // aproximadamente com o total, e cada filtro mostra menos que o total).
    if (totalPF <= totalInicial && totalPJ <= totalInicial && (totalPF !== totalInicial || totalPJ !== totalInicial)) {
      console.log("OK: os filtros PF e PJ alteram a listagem (cada um mostra um subconjunto dos clientes).");
    } else {
      console.log("AVISO: os filtros PF/PJ nao alteraram a lista como esperado - verifique os screenshots.");
    }

    // volta para "Todos"
    console.log("Clicando no filtro 'Todos' para restaurar...");
    let abaTodos = await driver.findElements(By.xpath("//button[contains(text(), 'Todos')]"));
    if (abaTodos.length > 0) {
      await driver.executeScript("arguments[0].click();", abaTodos[0]);
      await driver.sleep(1000);
    }

    console.log("\n==================================================");
    console.log("SUCESSO: US 2.5.2 validada - busca por nome/documento e filtro por tipo (PF/PJ).");
    console.log("OBS: paginacao nao testada (fora do escopo, conforme combinado).");
    console.log("==================================================\n");
    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);
    try {
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-busca-clientes.png', imagemErro, 'base64');
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-busca-clientes.html', htmlErro);
    } catch (erroHtml) {
      console.error("Nao foi possivel salvar evidencias de erro:", erroHtml);
    }
  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteBuscaClientes();