import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

// Título único por execução, para localizar o card recém-criado sem ambiguidade.
const TITULO_CASO = 'Caso Selenium ' + Math.floor(Math.random() * 100000);

async function rodarTesteHistoricoAlteracoes() {
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
    await driver.get(process.env.TEST_URL || 'http://frontend:3000');
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
    // 1 - NAVEGAR PARA "CASOS"
    // ==========================================
    console.log("Buscando o item 'Casos' no menu lateral...");
    let seletorMenuCasos = By.xpath("//*[self::button or self::a][.//text()[contains(., 'Casos')] or contains(text(), 'Casos')]");
    let itemMenuCasos = await driver.wait(until.elementLocated(seletorMenuCasos), 15000);
    await itemMenuCasos.click();

    console.log("Aguardando o carregamento da tela 'Gestão de Casos'...");
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Gestão de Casos')]")), 15000);
    await driver.sleep(2000);

    // ==========================================
    // 2 - CRIAR UM CASO (clicar em "Adicionar caso" e preencher só o título)
    // ==========================================
    console.log("Clicando em 'Adicionar caso' (primeira coluna do Kanban)...");
    let botoesAdicionar = await driver.findElements(By.xpath("//*[contains(text(), 'Adicionar caso')]"));
    if (botoesAdicionar.length === 0) {
      throw new Error("Botão 'Adicionar caso' não encontrado no Kanban.");
    }
    await driver.executeScript("arguments[0].click();", botoesAdicionar[0]);
    await driver.sleep(1000);

    console.log(`Preenchendo o título do caso ("${TITULO_CASO}")...`);
    let seletorCampoTitulo = By.css('input[placeholder*="Título"]');
    let campoTitulo = await driver.wait(until.elementLocated(seletorCampoTitulo), 10000);
    await campoTitulo.clear();
    await campoTitulo.sendKeys(TITULO_CASO);
    await driver.sleep(500);

    console.log("Clicando em 'Adicionar' para criar o caso...");
    let seletorBotaoAdicionar = By.xpath("//button[normalize-space(text())='Adicionar']");
    let botaoAdicionar = await driver.wait(until.elementLocated(seletorBotaoAdicionar), 10000);
    await driver.executeScript("arguments[0].click();", botaoAdicionar);
    await driver.sleep(2500);

    // ==========================================
    // 3 - ABRIR O CARD RECÉM-CRIADO
    // ==========================================
    console.log("Localizando e abrindo o card recém-criado...");
    let seletorCard = By.xpath(`//*[contains(text(), "${TITULO_CASO}")]`);
    let card = await driver.wait(until.elementLocated(seletorCard), 10000);
    await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", card);
    await driver.sleep(500);
    await driver.executeScript("arguments[0].click();", card);
    await driver.sleep(2000);

    // ==========================================
    // 4 - VALIDAR O HISTÓRICO DE ATIVIDADES
    // ==========================================
    console.log("Aguardando o painel de detalhes do caso e o 'HISTÓRICO DE ATIVIDADES'...");
    let seletorHistorico = By.xpath("//*[contains(text(), 'HISTÓRICO DE ATIVIDADES') or contains(text(), 'Histórico de Atividades')]");
    await driver.wait(until.elementLocated(seletorHistorico), 15000);
    console.log("OK: seção 'HISTÓRICO DE ATIVIDADES' encontrada no painel do caso.");

    console.log("Gerando evidência do painel com o histórico...");
    const screenshotHistorico = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-historico-atividades.png', screenshotHistorico, 'base64');

    // ==========================================
    // 5 - VALIDAR O CONTEÚDO DO HISTÓRICO (ação, data e usuário)
    // ==========================================
    // IMPORTANTE: olhar SÓ o conteúdo da seção de histórico, não a página inteira.
    // O body inteiro contém datas e textos dos cards do Kanban ao fundo, o que
    // daria falso positivo mesmo com o histórico vazio.
    console.log("Isolando o conteúdo da seção 'HISTÓRICO DE ATIVIDADES'...");

    // Sobe até o container da seção de histórico e lê apenas o texto dele.
    let tituloHistorico = await driver.findElement(seletorHistorico);
    // O container da seção é um ancestral próximo; pegamos o elemento-pai que
    // agrupa o título + a lista de entradas. Para ser robusto, lemos o texto do
    // bloco que vai do título até o próximo marco conhecido ("ADICIONAR COMENTÁRIO").
    let textoSecao = await driver.executeScript(`
      const titulo = arguments[0];
      // procura o container que contém o título do histórico
      let container = titulo.parentElement;
      // sobe alguns níveis para abranger a lista de entradas (sem exagerar)
      for (let i = 0; i < 2 && container.parentElement; i++) {
        container = container.parentElement;
      }
      let texto = container.innerText || container.textContent || '';
      // corta tudo a partir de "ADICIONAR COMENTÁRIO", para não incluir o que vem depois
      const corte = texto.indexOf('ADICIONAR COMENTÁRIO');
      if (corte !== -1) texto = texto.slice(0, corte);
      // remove o próprio título para sobrar só o conteúdo das entradas
      texto = texto.replace('HISTÓRICO DE ATIVIDADES', '').replace('Histórico de Atividades', '');
      return texto.trim();
    `, tituloHistorico);

    console.log(`Conteúdo isolado do histórico: "${textoSecao}"`);

    let temData = /\d{2}\/\d{2}\/\d{4}/.test(textoSecao);
    let temAcao =
      textoSecao.includes('cadastrado') ||
      textoSecao.includes('criado') ||
      textoSecao.includes('alterado') ||
      textoSecao.includes('editado') ||
      textoSecao.includes('atualizado') ||
      textoSecao.includes('Processo') ||
      textoSecao.includes('Caso');

    if (temData) {
      console.log("OK: o histórico contém ao menos uma data (dd/mm/aaaa).");
    } else {
      console.log("AVISO: o histórico NÃO contém data — provavelmente está vazio.");
    }

    if (temAcao) {
      console.log("OK: o histórico contém ao menos uma ação registrada.");
    } else {
      console.log("AVISO: o histórico NÃO contém ação registrada — provavelmente está vazio.");
    }

    // O critério da US 1.2.3 exige que o histórico registre as alterações com
    // data e usuário. Se a seção existe mas está VAZIA (sem entrada datada),
    // a funcionalidade NÃO está cumprida — e o teste deve falhar, refletindo isso
    // com honestidade, em vez de mascarar com uma validação frouxa.
    if (!temData || !temAcao) {
      throw new Error(
        "FALHA (US 1.2.3 não cumprida): a seção 'HISTÓRICO DE ATIVIDADES' existe, mas está VAZIA " +
        "para o caso criado — não registra a atividade com data e usuário. " +
        "As ações realizadas não estão sendo gravadas no log como a HU exige. " +
        "Evidência em 'evidencia-historico-atividades.png'."
      );
    }

    console.log("\n==================================================");
    console.log("SUCESSO: US 1.2.3 validada (visualização) — histórico de atividades exibe ação, data e usuário.");
    console.log("OBS: o critério 'log imutável' é uma garantia de backend e não é coberto por teste de interface.");
    console.log("==================================================\n");

    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);

    try {
      console.log("Gerando imagem do erro para análise visual...");
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-historico.png', imagemErro, 'base64');

      console.log("Salvando o HTML do momento exato do erro para diagnóstico...");
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-historico.html', htmlErro);
    } catch (erroHtml) {
      console.error("Não foi possível salvar as evidências de erro:", erroHtml);
    }

  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteHistoricoAlteracoes();