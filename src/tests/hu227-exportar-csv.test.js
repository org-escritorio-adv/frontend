import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

async function rodarTesteExportarCsv() {
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
    // 1 - IR PARA PROCESSOS
    // ==========================================
    console.log("Buscando o item 'Proc.' no menu lateral...");
    let seletorMenuProc = By.xpath("//*[self::button or self::a][.//text()[contains(., 'Proc.')] or contains(text(), 'Proc.')]");
    let itemMenuProc = await driver.wait(until.elementLocated(seletorMenuProc), 15000);
    await itemMenuProc.click();

    console.log("Aguardando o carregamento da tela 'Processos Judiciais'...");
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Processos Judiciais')]")), 15000);
    await driver.sleep(2000);

    // ==========================================
    // 2 - VALIDAR O BOTÃO "EXPORTAR CSV" (AC: opção para gerar CSV)
    // ==========================================
    console.log("Verificando a presença do botão 'Exportar CSV'...");
    let seletorBotaoCsv = By.xpath("//button[contains(text(), 'Exportar CSV')]");
    let botaoCsv = await driver.wait(until.elementLocated(seletorBotaoCsv), 10000);
    console.log("OK: botão 'Exportar CSV' presente na tela de processos.");

    console.log("Clicando no botão para confirmar que não gera erro na interface...");
    await botaoCsv.click();
    await driver.sleep(3000);

    // O service usa alert() em caso de falha; confirma que nenhum alerta apareceu.
    try {
      let alerta = await driver.switchTo().alert();
      let textoAlerta = await alerta.getText();
      await alerta.accept();
      throw new Error(`A exportação exibiu um alerta de erro: "${textoAlerta}"`);
    } catch (semAlerta) {
      if (semAlerta.message && semAlerta.message.includes('exportação exibiu')) {
        throw semAlerta;
      }
      console.log("OK: clique no botão não gerou alerta de erro.");
    }

    console.log("Gerando evidência da tela com o botão de CSV...");
    const screenshotBotao = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-botao-exportar-csv.png', screenshotBotao, 'base64');

    // ==========================================
    // 3 - BAIXAR O CSV DE VERDADE (via API, com o token da sessão) E VALIDAR CONTEÚDO
    // ==========================================
    console.log("Baixando o CSV via API para validar o conteúdo...");

    let resultado = await driver.executeAsyncScript(`
      const callback = arguments[arguments.length - 1];
      (async () => {
        const token = localStorage.getItem('token');
        const basesParaTentar = [
          (window.location.origin || '').replace(/:\\d+$/, ':8000'),
          'http://localhost:8000',
          'http://backend:8000',
          'http://127.0.0.1:8000'
        ];

        let ultimoMotivo = '';
        for (const base of basesParaTentar) {
          if (!base) continue;
          try {
            const resp = await fetch(base + '/processos/exportar-csv', {
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!resp.ok) {
              ultimoMotivo = 'Status ' + resp.status + ' em ' + base;
              continue;
            }
            const texto = await resp.text();
            callback({
              ok: true,
              baseUsada: base,
              tamanho: texto.length,
              conteudo: texto,
              contentType: resp.headers.get('content-type')
            });
            return;
          } catch (e) {
            ultimoMotivo = String(e) + ' em ' + base;
          }
        }
        callback({ ok: false, motivo: ultimoMotivo });
      })();
    `);

    if (!resultado.ok) {
      throw new Error(`Falha ao baixar o CSV pela API: ${resultado.motivo}`);
    }

    console.log(`CSV baixado (${resultado.tamanho} bytes) via ${resultado.baseUsada}.`);

    // Salva o CSV como evidência
    console.log("Salvando o CSV gerado como evidência...");
    fs.writeFileSync('src/tests/evidencia-processos.csv', resultado.conteudo, 'utf8');
    console.log("OK: CSV salvo em src/tests/evidencia-processos.csv");

    // ==========================================
    // 4 - VALIDAR AS COLUNAS-CHAVE (AC: Número, Cliente, Tribunal, Status)
    // ==========================================
    console.log("Validando o cabeçalho do CSV (colunas-chave)...");
    // Pega a primeira linha (cabeçalho) e normaliza para minúsculas sem acento.
    let primeiraLinha = resultado.conteudo.split(/\r?\n/)[0] || '';
    let cabecalho = primeiraLinha
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // remove acentos para comparação robusta
    console.log(`Cabeçalho do CSV: "${primeiraLinha}"`);

    // Mapeia cada critério para os termos aceitáveis no cabeçalho.
    const colunasEsperadas = [
      { nome: 'Número', termos: ['numero', 'cnj', 'processo'] },
      { nome: 'Cliente', termos: ['cliente'] },
      { nome: 'Tribunal', termos: ['tribunal'] },
      { nome: 'Status', termos: ['status'] }
    ];

    let faltando = [];
    for (const coluna of colunasEsperadas) {
      let presente = coluna.termos.some(t => cabecalho.includes(t));
      if (presente) {
        console.log(`OK: coluna "${coluna.nome}" presente no CSV.`);
      } else {
        console.log(`FALTANDO: coluna "${coluna.nome}" não encontrada no cabeçalho.`);
        faltando.push(coluna.nome);
      }
    }

    if (faltando.length > 0) {
      throw new Error(
        `O CSV não contém todas as colunas-chave exigidas. Faltando: ${faltando.join(', ')}.`
      );
    }

    console.log("\n==================================================");
    console.log("SUCESSO: US 2.2.7 validada — CSV gerado com as colunas Número, Cliente, Tribunal e Status.");
    console.log("==================================================\n");

    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);

    try {
      console.log("Gerando imagem do erro para análise visual...");
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-exportar-csv.png', imagemErro, 'base64');

      console.log("Salvando o HTML do momento exato do erro para diagnóstico...");
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-exportar-csv.html', htmlErro);
    } catch (erroHtml) {
      console.error("Não foi possível salvar as evidências de erro:", erroHtml);
    }

  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteExportarCsv();