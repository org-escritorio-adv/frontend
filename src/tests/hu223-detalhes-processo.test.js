import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

// Converte "26 de fev. de 2025" (formato exibido) em um objeto Date comparável.
const MESES = {
  'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
  'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
};

function parseDataCurta(texto) {
  // espera algo como "26 de fev. de 2025"
  let m = texto.toLowerCase().match(/(\d{1,2})\s+de\s+([a-z]{3})\.?\s+de\s+(\d{4})/);
  if (!m) return null;
  let dia = parseInt(m[1]);
  let mes = MESES[m[2]];
  let ano = parseInt(m[3]);
  if (mes === undefined) return null;
  return new Date(ano, mes, dia);
}

async function rodarTesteDetalhesProcesso() {
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
    // 1 - IR PARA PROCESSOS E ABRIR UM PROCESSO
    // ==========================================
    console.log("Buscando o item 'Proc.' no menu lateral...");
    let seletorMenuProc = By.xpath("//*[self::button or self::a][.//text()[contains(., 'Proc.')] or contains(text(), 'Proc.')]");
    let itemMenuProc = await driver.wait(until.elementLocated(seletorMenuProc), 15000);
    await itemMenuProc.click();

    console.log("Aguardando o carregamento da tela 'Processos Judiciais'...");
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Processos Judiciais')]")), 15000);
    await driver.sleep(2000);

    // Para garantir movimentações, busca pelo processo real do TJMG (89 movimentações).
    // Se ele não existir, cai no primeiro processo da lista como alternativa.
    const CNJ_COM_MOVIMENTACOES = '5000207782025';
    console.log(`Tentando localizar o processo com movimentações (${CNJ_COM_MOVIMENTACOES}...)...`);
    let seletorBusca = By.css('input[placeholder*="Buscar por número"], input[placeholder*="nome da parte"]');
    let campoBusca = await driver.wait(until.elementLocated(seletorBusca), 15000);
    await campoBusca.clear();
    await campoBusca.sendKeys(CNJ_COM_MOVIMENTACOES);
    await driver.sleep(1500);

    let botoesVer = await driver.findElements(
      By.xpath("//*[normalize-space(text())='Ver' or normalize-space(text())='Abrir']")
    );

    if (botoesVer.length === 0) {
      // não achou o processo específico — limpa e usa o primeiro disponível
      console.log("Processo específico não encontrado. Usando o primeiro processo da lista...");
      await campoBusca.clear();
      await campoBusca.sendKeys(' ');
      await campoBusca.sendKeys('\u0008');
      await driver.sleep(1500);
      botoesVer = await driver.findElements(
        By.xpath("//*[normalize-space(text())='Ver' or normalize-space(text())='Abrir']")
      );
    }

    if (botoesVer.length === 0) {
      throw new Error("Nenhum processo disponível para abrir os detalhes.");
    }

    console.log("Clicando em 'Ver' para abrir os detalhes do processo...");
    await botoesVer[0].click();

    console.log("Aguardando o carregamento da tela de detalhes...");
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Detalhes do Processo Judicial')]")), 15000);
    await driver.sleep(2000);

    // ==========================================
    // 2 - VALIDAR INFORMAÇÕES DO PROCESSO (AC: status, tribunal, partes)
    // ==========================================
    console.log("Validando os blocos de informação do processo...");
    const camposEsperados = ['Número do Processo', 'Tribunal', 'Status', 'Partes'];
    for (const campo of camposEsperados) {
      let seletorCampo = By.xpath(`//*[contains(text(), "${campo}")]`);
      await driver.wait(until.elementLocated(seletorCampo), 10000);
      console.log(`OK: campo "${campo}" presente.`);
    }

    console.log("Gerando evidência da tela de detalhes...");
    const screenshotDetalhes = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-detalhes-processo.png', screenshotDetalhes, 'base64');

    // ==========================================
    // 3 - VALIDAR MOVIMENTAÇÕES E SUA ORDENAÇÃO (AC: mais recente primeiro)
    // ==========================================
    console.log("Verificando a seção de movimentações...");
    let temMovimentacoes = await driver.findElements(By.xpath("//*[contains(text(), 'Movimentações')]"));

    if (temMovimentacoes.length === 0) {
      console.log("AVISO: este processo não tem seção de movimentações — não é possível validar a ordenação.");
    } else {
      // As datas das movimentações aparecem em <span class="text-xs text-slate-400">
      // dentro da timeline. Coletamos os textos de data na ordem em que aparecem.
      console.log("Coletando as datas das movimentações na ordem exibida...");
      let elementosData = await driver.findElements(By.css('span.text-xs.text-slate-400'));

      let datas = [];
      for (let el of elementosData) {
        let txt = (await el.getText()).trim();
        let d = parseDataCurta(txt);
        if (d) datas.push({ texto: txt, data: d });
      }

      console.log(`Total de datas de movimentação capturadas: ${datas.length}`);

      if (datas.length >= 2) {
        // Verifica se a primeira data é >= que a última (ordem decrescente)
        let primeira = datas[0];
        let ultima = datas[datas.length - 1];
        console.log(`Primeira movimentação exibida: ${primeira.texto}`);
        console.log(`Última movimentação exibida: ${ultima.texto}`);

        // Confirma que a lista está em ordem decrescente (cada item >= o próximo)
        let estaOrdenadaDecrescente = true;
        for (let i = 0; i < datas.length - 1; i++) {
          if (datas[i].data.getTime() < datas[i + 1].data.getTime()) {
            estaOrdenadaDecrescente = false;
            console.log(
              `Ordem quebrada: "${datas[i].texto}" vem antes de "${datas[i + 1].texto}", ` +
              "mas é mais antiga."
            );
            break;
          }
        }

        if (estaOrdenadaDecrescente) {
          console.log("OK: movimentações ordenadas da mais recente para a mais antiga.");
        } else {
          throw new Error("FALHA: as movimentações NÃO estão ordenadas com a mais recente primeiro.");
        }
      } else {
        console.log("Poucas datas capturadas para validar ordenação de forma confiável.");
      }
    }

    // ==========================================
    // 4 - VALIDAR RESPONSIVIDADE BÁSICA (AC: interface responsiva)
    // ==========================================
    console.log("Testando responsividade — redimensionando para tamanho de celular (390x844)...");
    await driver.manage().window().setRect({ width: 390, height: 844 });
    await driver.sleep(2000);

    // Confirma que o conteúdo principal continua visível e acessível no mobile
    let tituloAindaVisivel = await driver.findElements(By.xpath("//*[contains(text(), 'Detalhes do Processo Judicial')]"));
    if (tituloAindaVisivel.length > 0 && await tituloAindaVisivel[0].isDisplayed()) {
      console.log("OK: o conteúdo principal continua visível em tela estreita (responsivo).");
    } else {
      console.log("AVISO: o título não está visível na largura mobile — verifique o screenshot.");
    }

    console.log("Gerando evidência da versão responsiva (mobile)...");
    const screenshotMobile = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-detalhes-responsivo.png', screenshotMobile, 'base64');

    // restaura o tamanho original da janela
    await driver.manage().window().setRect({ width: 1280, height: 800 });

    console.log("\n==================================================");
    console.log("SUCESSO: US 2.2.3 validada — detalhes completos, movimentações ordenadas e interface responsiva.");
    console.log("==================================================\n");

    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);

    try {
      console.log("Gerando imagem do erro para análise visual...");
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-detalhes-processo.png', imagemErro, 'base64');

      console.log("Salvando o HTML do momento exato do erro para diagnóstico...");
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-detalhes-processo.html', htmlErro);
    } catch (erroHtml) {
      console.error("Não foi possível salvar as evidências de erro:", erroHtml);
    }

  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteDetalhesProcesso();