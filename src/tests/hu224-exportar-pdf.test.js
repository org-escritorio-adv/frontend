import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

async function rodarTesteExportarPdf() {
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

    console.log("Abrindo o primeiro processo da lista...");
    let botoesVer = await driver.findElements(
      By.xpath("//*[normalize-space(text())='Ver' or normalize-space(text())='Abrir']")
    );
    if (botoesVer.length === 0) {
      throw new Error("Nenhum processo disponível para abrir os detalhes.");
    }
    await botoesVer[0].click();

    console.log("Aguardando o carregamento da tela de detalhes...");
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Detalhes do Processo Judicial')]")), 15000);
    await driver.sleep(2000);

    // Captura o número CNJ exibido (usado para montar a validação e o nome do arquivo)
    let numeroProcessoEl = await driver.findElement(By.css('p.font-mono'));
    let numeroProcesso = (await numeroProcessoEl.getText()).trim();
    console.log(`Processo aberto: ${numeroProcesso}`);

    // ==========================================
    // 2 - VALIDAR O BOTÃO "EXPORTAR PARA PDF" (AC: opção na tela de detalhes)
    // ==========================================
    console.log("Verificando a presença do botão 'Exportar para PDF'...");
    let seletorBotaoPdf = By.xpath("//button[contains(text(), 'Exportar para PDF')]");
    let botaoPdf = await driver.wait(until.elementLocated(seletorBotaoPdf), 10000);
    console.log("OK: botão 'Exportar para PDF' presente na tela de detalhes.");

    console.log("Clicando no botão para confirmar que não gera erro na interface...");
    await botaoPdf.click();
    await driver.sleep(3000);

    // Confirma que nenhum alerta de erro do JS apareceu (o service usa alert() em caso de falha)
    try {
      let alerta = await driver.switchTo().alert();
      let textoAlerta = await alerta.getText();
      await alerta.accept();
      throw new Error(`A exportação exibiu um alerta de erro: "${textoAlerta}"`);
    } catch (semAlerta) {
      // Não havia alerta — comportamento esperado
      if (semAlerta.message && semAlerta.message.includes('exportação exibiu')) {
        throw semAlerta;
      }
      console.log("OK: clique no botão não gerou alerta de erro.");
    }

    console.log("Gerando evidência da tela de detalhes com o botão de PDF...");
    const screenshotBotao = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-botao-exportar-pdf.png', screenshotBotao, 'base64');

    // ==========================================
    // 3 - VALIDAR O PDF DE VERDADE (baixando pela rota com o token da sessão)
    // ==========================================
    // Extrai o id do processo da URL ou usa o fluxo: como a tela não expõe o id
    // diretamente, baixamos o PDF via fetch dentro do navegador (que já tem o token),
    // e verificamos a assinatura do arquivo.
    console.log("Baixando o PDF via API (usando o token da sessão) para validar o arquivo...");

    // Descobre a base da API e o token guardados pelo app
    let resultadoDownload = await driver.executeAsyncScript(`
      const callback = arguments[arguments.length - 1];
      (async () => {
        const token = localStorage.getItem('token');
        // Tenta várias bases até uma responder — o endereço acessível pelo
        // navegador pode variar conforme o ambiente (Docker, local, etc.).
        const basesParaTentar = [
          'https://escritorio-adv-api.vercel.app'
        ];

        let ultimoMotivo = '';
        for (const base of basesParaTentar) {
          if (!base) continue;
          try {
            const respLista = await fetch(base + '/processos/', {
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!respLista.ok) {
              ultimoMotivo = 'Lista status ' + respLista.status + ' em ' + base;
              continue;
            }
            const processos = await respLista.json();
            if (!processos || processos.length === 0) {
              ultimoMotivo = 'Lista vazia em ' + base;
              continue;
            }
            const id = processos[0].id;

            const resp = await fetch(base + '/processos/' + id + '/exportar-pdf', {
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!resp.ok) {
              ultimoMotivo = 'PDF status ' + resp.status + ' em ' + base;
              continue;
            }
            const buffer = await resp.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            const assinatura = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);

            // converte os bytes para base64 para conseguir trazer o arquivo
            // de volta do navegador para o Node e salvá-lo como evidência.
            let binario = '';
            for (let i = 0; i < bytes.length; i++) {
              binario += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binario);

            callback({
              ok: true,
              baseUsada: base,
              id: id,
              tamanho: bytes.length,
              assinatura: assinatura,
              contentType: resp.headers.get('content-type'),
              base64: base64
            });
            return;
          } catch (e) {
            ultimoMotivo = String(e) + ' em ' + base;
          }
        }
        callback({ ok: false, motivo: ultimoMotivo });
      })();
    `);

    console.log("Resultado do download do PDF:", JSON.stringify(resultadoDownload));

    if (!resultadoDownload.ok) {
      throw new Error(`Falha ao baixar o PDF pela API: ${resultadoDownload.motivo}`);
    }

    if (resultadoDownload.assinatura !== '%PDF') {
      throw new Error(
        `O arquivo retornado não é um PDF válido (assinatura: "${resultadoDownload.assinatura}").`
      );
    }

    if (resultadoDownload.tamanho < 500) {
      throw new Error(
        `O PDF gerado está suspeito de estar vazio/corrompido (apenas ${resultadoDownload.tamanho} bytes).`
      );
    }

    console.log(
      `OK: PDF válido gerado — assinatura "%PDF", ${resultadoDownload.tamanho} bytes, ` +
      `content-type "${resultadoDownload.contentType}" (via ${resultadoDownload.baseUsada}).`
    );

    // Salva o PDF de verdade como evidência, para poder abrir e conferir o conteúdo.
    console.log("Salvando o PDF gerado como evidência...");
    fs.writeFileSync('src/tests/evidencia-relatorio-processo.pdf', resultadoDownload.base64, 'base64');
    console.log("OK: PDF salvo em src/tests/evidencia-relatorio-processo.pdf");

    console.log("\n==================================================");
    console.log("SUCESSO: US 2.2.4 validada — botão presente na tela e PDF válido gerado pela API.");
    console.log("==================================================\n");

    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);

    try {
      console.log("Gerando imagem do erro para análise visual...");
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-exportar-pdf.png', imagemErro, 'base64');

      console.log("Salvando o HTML do momento exato do erro para diagnóstico...");
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-exportar-pdf.html', htmlErro);
    } catch (erroHtml) {
      console.error("Não foi possível salvar as evidências de erro:", erroHtml);
    }

  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteExportarPdf();