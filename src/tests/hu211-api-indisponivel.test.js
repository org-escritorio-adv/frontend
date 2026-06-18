import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

async function procurarTextoNaPagina(driver, candidatos) {
  for (const texto of candidatos) {
    let seletor = By.xpath(`//*[contains(text(), "${texto}")]`);
    let elementos = await driver.findElements(seletor);
    if (elementos.length > 0) {
      return { texto, quantidade: elementos.length };
    }
  }
  return null;
}

async function rodarTesteApiIndisponivel() {
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
    // 0 - LOGIN (mesmo fluxo já validado anteriormente)
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
    // 1 - NAVEGAR PARA "PROC." NO MENU LATERAL
    // ==========================================
    console.log("Buscando o item 'Proc.' no menu lateral...");
    let seletorMenuProc = By.xpath("//*[self::button or self::a][.//text()[contains(., 'Proc.')] or contains(text(), 'Proc.')]");
    let itemMenuProc = await driver.wait(until.elementLocated(seletorMenuProc), 15000);
    await itemMenuProc.click();

    console.log("Aguardando o carregamento da tela 'Processos Judiciais'...");
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Processos Judiciais')]")), 15000);

    // ==========================================
    // 2 - CAPTURAR ESTADO ANTES DO CLIQUE (para comparar depois)
    // ==========================================
    console.log("Capturando o texto de 'Última sincronização' antes do clique...");
    let seletorUltimaSincronizacao = By.xpath("//*[contains(text(), 'Última sincronização')]");
    let elementoSincronizacaoAntes = await driver.wait(until.elementLocated(seletorUltimaSincronizacao), 15000);
    let textoSincronizacaoAntes = await elementoSincronizacaoAntes.getText();
    console.log(`Texto antes: "${textoSincronizacaoAntes}"`);

    console.log("Contando quantos processos aparecem na listagem antes do clique...");
    let botoesVerAntes = await driver.findElements(By.xpath("//*[contains(text(), 'Ver')]"));
    console.log(`Processos visíveis antes: ${botoesVerAntes.length}`);

    console.log("Gerando evidência do estado ANTES da sincronização...");
    const screenshotAntes = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-antes-sincronizar.png', screenshotAntes, 'base64');

    // ==========================================
    // 3 - CLICAR EM "SINCRONIZAR DATAJUD"
    // ==========================================
    console.log("Clicando em 'Sincronizar DataJud'...");
    let seletorBotaoSincronizar = By.xpath("//*[contains(text(), 'Sincronizar DataJud')]");
    let botaoSincronizar = await driver.wait(until.elementLocated(seletorBotaoSincronizar), 15000);
    await botaoSincronizar.click();

    console.log("Aguardando o sistema tentar (e falhar) a sincronização com o DataJud indisponível...");
    await driver.sleep(8000); // tempo generoso para o backend tentar e cair em erro/timeout

    console.log("Gerando evidência do estado APÓS o clique...");
    const screenshotDepois = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-depois-sincronizar.png', screenshotDepois, 'base64');

    // ==========================================
    // 4 - VERIFICAR SE APARECEU ALGUMA MENSAGEM DE ERRO (AC: mensagem de erro clara)
    // ==========================================
    console.log("Procurando alguma mensagem de erro/aviso na tela...");
    const candidatosDeErro = [
      'indisponível', 'indisponivel', 'Indisponível',
      'Erro ao sincronizar', 'erro ao sincronizar',
      'não foi possível', 'nao foi possivel',
      'falha na sincronização', 'falha ao sincronizar', 'Falha',
      'tente novamente', 'Tente novamente',
      'desatualizado', 'desatualizada'
    ];
    let resultadoErro = await procurarTextoNaPagina(driver, candidatosDeErro);
    if (resultadoErro) {
      console.log(`OK: mensagem relacionada a erro encontrada: "${resultadoErro.texto}" (${resultadoErro.quantidade} ocorrência(s)).`);
    } else {
      console.log(
        "AVISO: nenhuma mensagem de erro reconhecida foi encontrada na tela. " +
        "Pode ser um texto diferente do esperado — confira o screenshot 'evidencia-depois-sincronizar.png' " +
        "e me diga a frase exata que apareceu, se apareceu alguma."
      );
    }

    // ==========================================
    // 5 - VERIFICAR SE O DADO ANTIGO + DATA CONTINUAM VISÍVEIS (AC: dados anteriores visíveis com aviso de data)
    // ==========================================
    console.log("Verificando se o texto de 'Última sincronização' permaneceu o mesmo (dado antigo preservado)...");
    let elementoSincronizacaoDepois = await driver.findElement(seletorUltimaSincronizacao);
    let textoSincronizacaoDepois = await elementoSincronizacaoDepois.getText();
    console.log(`Texto depois: "${textoSincronizacaoDepois}"`);

    if (textoSincronizacaoDepois === textoSincronizacaoAntes) {
      console.log("OK: o timestamp não mudou — o dado antigo com sua data continua visível, como esperado quando a sincronização falha.");
    } else {
      console.log("AVISO: o timestamp mudou após o clique. Se a sincronização realmente falhou, isso seria inesperado — verifique manualmente.");
    }

    // ==========================================
    // 6 - VERIFICAR SE OS PROCESSOS ANTIGOS CONTINUAM NA LISTAGEM
    // ==========================================
    console.log("Contando quantos processos aparecem na listagem depois do clique...");
    let botoesVerDepois = await driver.findElements(By.xpath("//*[contains(text(), 'Ver')]"));
    console.log(`Processos visíveis depois: ${botoesVerDepois.length}`);

    if (botoesVerDepois.length === botoesVerAntes.length && botoesVerDepois.length > 0) {
      console.log("OK: a listagem de processos não foi apagada — dados antigos continuam visíveis.");
    } else {
      console.log("AVISO: a quantidade de processos exibidos mudou após a tentativa de sincronização.");
    }

    // ==========================================
    // 7 - VERIFICAR SE O SISTEMA NÃO TRAVOU (AC: sistema não trava em caso de timeout)
    // ==========================================
    console.log("Verificando se o botão 'Sincronizar DataJud' voltou a ficar habilitado (não travou em loading infinito)...");
    let botaoSincronizarDepois = await driver.findElement(seletorBotaoSincronizar);
    let estaHabilitado = await botaoSincronizarDepois.isEnabled();
    console.log(`Botão está ${estaHabilitado ? 'HABILITADO' : 'DESABILITADO'} após a tentativa.`);

    console.log("Verificando se a interface continua respondendo a cliques (navegando para 'Início')...");
    let seletorMenuInicio = By.xpath("//*[self::button or self::a][.//text()[contains(., 'Início')] or contains(text(), 'Início')]");
    let itemMenuInicio = await driver.wait(until.elementLocated(seletorMenuInicio), 10000);
    await itemMenuInicio.click();
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Bem-vindo')]")), 10000);
    console.log("OK: a interface continua respondendo normalmente após a tentativa de sincronização (sistema não travou).");

    console.log("\n==================================================");
    console.log("TESTE EXPLORATÓRIO FINALIZADO — revise os logs 'OK'/'AVISO' acima para validar a US 2.1.1.");
    console.log("==================================================\n");

  } catch (erro) {
    console.error("O teste falhou:", erro);

    try {
      console.log("Gerando imagem do erro para análise visual...");
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-api-indisponivel.png', imagemErro, 'base64');

      console.log("Salvando o HTML do momento exato do erro para diagnóstico...");
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-api-indisponivel.html', htmlErro);
    } catch (erroHtml) {
      console.error("Não foi possível salvar as evidências de erro:", erroHtml);
    }

  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteApiIndisponivel();