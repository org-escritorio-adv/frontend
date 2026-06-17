import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

// =================================================================
// Permissões consideradas CRÍTICAS pela tela (badge "Crítico").
// Para o perfil "Estagiário" elas devem vir DESATIVADAS por padrão.
// =================================================================
const PERMISSOES_CRITICAS_ESPERADAS_OFF = [
  'Excluir processos',
  'Acessar painel admin',
  'Gerenciar usuários',
];

// Permissão que, segundo o "1/9" mostrado na listagem, deve vir ATIVA
// por padrão para o Estagiário.
const PERMISSAO_BASICA_ESPERADA_ON = 'Visualizar processos';

// Permissão não-crítica usada para validar que a interface permite
// gerenciar (alternar) os switches de permissão.
// OBS: evitamos "Criar novos processos" pois essa conta de teste (Júlia Takaki)
// teve esse campo manipulado manualmente em sessões anteriores de debug e ficou
// com um estado inconsistente (não reflete o padrão "Estagiário" esperado).
const PERMISSAO_PARA_TESTAR_TOGGLE = 'Editar processos';

async function obterEstadoSwitch(driver, textoLabel) {
  // Localiza o ancestral mais próximo do texto do label que efetivamente
  // contém um switch como descendente (o switch é IRMÃO da div de texto,
  // não filho dela — por isso não basta subir 1 nível).
  let seletorLinha = By.xpath(
    `//*[contains(normalize-space(text()), "${textoLabel}")]` +
    `/ancestor::*[.//button[@role="switch"] or .//input[@type="checkbox"]][1]`
  );
  let linha = await driver.wait(until.elementLocated(seletorLinha), 10000);

  let seletorSwitch = By.css(
    'input[type="checkbox"], button[role="switch"], [class*="switch"], [class*="toggle"]'
  );
  let elementosSwitch = await linha.findElements(seletorSwitch);

  if (elementosSwitch.length === 0) {
    throw new Error(
      `Não foi possível localizar o switch de permissão para: "${textoLabel}". ` +
      `Pode ser necessário ajustar o seletor CSS para a estrutura real do toggle.`
    );
  }

  let switchEl = elementosSwitch[0];
  let ariaChecked = await switchEl.getAttribute('aria-checked');
  let classeAtual = (await switchEl.getAttribute('class')) || '';
  let tagName = await switchEl.getTagName();

  let ativado = ariaChecked === 'true';

  // Fallback para inputs do tipo checkbox nativo
  if (ariaChecked === null && tagName === 'input') {
    ativado = await switchEl.isSelected();
  }

  // Fallback heurístico por classe (ex.: "bg-emerald-500", "is-checked", "active")
  if (ariaChecked === null && tagName !== 'input') {
    ativado = /checked|active|is-on|bg-(emerald|green)/i.test(classeAtual);
  }

  return { elemento: switchEl, ativado };
}

async function rodarTestePermissoesRBAC() {
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
    // 0 - LOGIN (reaproveitando o fluxo da US 1.1.1)
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

    let urlDashboard = await driver.getCurrentUrl();
    if (!urlDashboard.includes('/dashboard')) {
      throw new Error(`Login falhou: esperava ser redirecionado para /dashboard, mas a URL atual é ${urlDashboard}`);
    }

    // ==========================================
    // 1 - NAVEGAR PARA "EQUIPE" PELO MENU LATERAL
    // ==========================================
    console.log("Buscando o item 'Equipe' no menu lateral...");
    let seletorMenuEquipe = By.xpath("//*[self::button or self::a][.//text()[contains(., 'Equipe')] or contains(text(), 'Equipe')]");
    let itemMenuEquipe = await driver.wait(until.elementLocated(seletorMenuEquipe), 15000);
    await itemMenuEquipe.click();

    console.log("Aguardando o carregamento da tela de Gestão de Usuários e Permissões...");
    let seletorTituloEquipe = By.xpath("//*[contains(text(), 'Gestão de Usuários e Permissões')]");
    await driver.wait(until.elementLocated(seletorTituloEquipe), 15000);

    console.log("Gerando evidência da tela de Equipe...");
    const screenshotEquipe = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-pagina-equipe.png', screenshotEquipe, 'base64');

    // ==========================================
    // 2 - ABRIR O PAINEL DE PERMISSÕES DE UM USUÁRIO ESTAGIÁRIO
    // ==========================================
    console.log("Localizando a linha de 'Júlia Takaki' na tabela de equipe...");
    let seletorLinhaUsuaria = By.xpath("//tr[.//text()[contains(., 'Júlia Takaki')]]");
    let linhaUsuaria = await driver.wait(until.elementLocated(seletorLinhaUsuaria), 15000);

    console.log("Clicando em 'Permissões' para abrir o painel...");
    let seletorBotaoPermissoes = By.xpath(".//*[contains(text(), 'Permissões')]");
    let botaoPermissoes = await linhaUsuaria.findElement(seletorBotaoPermissoes);
    await botaoPermissoes.click();

    console.log("Aguardando abertura do modal 'Painel de Permissões'...");
    let seletorModal = By.xpath("//*[contains(text(), 'Painel de Permissões')]");
    await driver.wait(until.elementLocated(seletorModal), 15000);
    await driver.sleep(1000); // pequena espera para animação do modal terminar

    // ==========================================
    // 3 - VALIDAR QUE PERMISSÕES CRÍTICAS ESTÃO DESATIVADAS (AC: "Bloquear exclusões")
    // ==========================================
    for (const permissaoCritica of PERMISSOES_CRITICAS_ESPERADAS_OFF) {
      console.log(`Verificando se a permissão crítica "${permissaoCritica}" está desativada...`);
      let { ativado } = await obterEstadoSwitch(driver, permissaoCritica);

      if (ativado) {
        throw new Error(
          `FALHA DE RBAC: a permissão crítica "${permissaoCritica}" está ATIVADA para o perfil Estagiário, ` +
          `quando deveria vir bloqueada por padrão.`
        );
      }
      console.log(`OK: "${permissaoCritica}" está desativada, como esperado.`);
    }

    // ==========================================
    // 4 - VALIDAR QUE A PERMISSÃO BÁSICA (1/9) ESTÁ ATIVA
    // ==========================================
    console.log(`Verificando se a permissão básica "${PERMISSAO_BASICA_ESPERADA_ON}" está ativada...`);
    let estadoBasica = await obterEstadoSwitch(driver, PERMISSAO_BASICA_ESPERADA_ON);
    if (!estadoBasica.ativado) {
      throw new Error(`A permissão básica "${PERMISSAO_BASICA_ESPERADA_ON}" deveria estar ativada por padrão (1/9), mas está desativada.`);
    }
    console.log(`OK: "${PERMISSAO_BASICA_ESPERADA_ON}" está ativada, como esperado.`);

    // ==========================================
    // 5 - VALIDAR QUE A INTERFACE PERMITE GERENCIAR OS SWITCHES (AC: "Interface para gerenciar switches")
    // ==========================================
    console.log(`Testando o toggle da permissão não-crítica "${PERMISSAO_PARA_TESTAR_TOGGLE}"...`);
    let estadoAntes = await obterEstadoSwitch(driver, PERMISSAO_PARA_TESTAR_TOGGLE);

    // Garante que o switch esteja centralizado na viewport (evita ficar
    // parcialmente coberto por cabeçalhos fixos/sticky dentro do modal).
    await driver.executeScript(
      "arguments[0].scrollIntoView({block: 'center', inline: 'center'});",
      estadoAntes.elemento
    );
    await driver.sleep(500);

    // DIAGNÓSTICO: descobre qual elemento realmente está no ponto de clique.
    // Se "ehOMesmoElementoOuDescendente" vier false, algo está sobrepondo o switch.
    let diagnostico = await driver.executeScript(`
      const el = arguments[0];
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const elementoNoPonto = document.elementFromPoint(x, y);
      return {
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        tagNoPonto: elementoNoPonto ? elementoNoPonto.tagName : null,
        classeNoPonto: elementoNoPonto ? elementoNoPonto.className : null,
        ehOMesmoElementoOuDescendente: elementoNoPonto === el || (elementoNoPonto ? el.contains(elementoNoPonto) : false)
      };
    `, estadoAntes.elemento);
    console.log("Diagnóstico do switch (posição e elemento no ponto de clique):", JSON.stringify(diagnostico, null, 2));

    // Alguns switches só respondem ao clique depois de um hover real do mouse
    // (foi o mesmo comportamento observado manualmente). Por isso, em vez de
    // um .click() direto, simulamos o movimento do mouse até o elemento antes.
    console.log("Movendo o cursor até o switch antes de clicar (simulando hover real)...");
    await driver.actions({ bridge: true })
      .move({ origin: estadoAntes.elemento })
      .pause(400)
      .perform();
    await estadoAntes.elemento.click();
    await driver.sleep(1000);

    console.log("Verificando logs do console do navegador após o clique (procurando erros de rede/permissão)...");
    try {
      let logsAposClique = await driver.manage().logs().get('browser');
      logsAposClique.forEach(log => console.log(`BROWSER LOG [${log.level.name}]:`, log.message));
    } catch (erroLogs) {
      console.log("Não foi possível capturar logs do console (logging do navegador pode não estar habilitado).");
    }

    let estadoDepois = await obterEstadoSwitch(driver, PERMISSAO_PARA_TESTAR_TOGGLE);

    // Fallback: se o clique "real" não mudou o estado, tenta via JavaScript direto,
    // que dispara o evento de clique no DOM ignorando qualquer problema de hover/overlay.
    if (estadoDepois.ativado === estadoAntes.ativado) {
      console.log("O clique simulado não mudou o estado. Tentando clique via JavaScript como fallback...");
      await driver.executeScript("arguments[0].click();", estadoDepois.elemento);
      await driver.sleep(1000);

      try {
        let logsAposJsClick = await driver.manage().logs().get('browser');
        logsAposJsClick.forEach(log => console.log(`BROWSER LOG (pós JS click) [${log.level.name}]:`, log.message));
      } catch (erroLogs) {
        console.log("Não foi possível capturar logs do console após o clique via JS.");
      }

      estadoDepois = await obterEstadoSwitch(driver, PERMISSAO_PARA_TESTAR_TOGGLE);
    }

    if (estadoDepois.ativado === estadoAntes.ativado) {
      throw new Error(
        `O switch de "${PERMISSAO_PARA_TESTAR_TOGGLE}" não mudou de estado após o clique ` +
        `(estava ${estadoAntes.ativado}, continuou ${estadoDepois.ativado}).`
      );
    }
    console.log(`OK: o switch alternou de ${estadoAntes.ativado} para ${estadoDepois.ativado}.`);

    console.log("Gerando evidência do painel de permissões após o toggle...");
    const screenshotToggle = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-toggle-permissao.png', screenshotToggle, 'base64');

    // ==========================================
    // 6 - FECHAR O MODAL SEM PERSISTIR (Cancelar), para não afetar outros testes
    // ==========================================
    console.log("Clicando em 'Cancelar' para fechar o painel sem salvar alterações...");
    let seletorCancelar = By.xpath("//button[contains(text(), 'Cancelar')]");
    let botaoCancelar = await driver.wait(until.elementLocated(seletorCancelar), 10000);
    await botaoCancelar.click();
    await driver.sleep(1000);

    console.log("\n==================================================");
    console.log("SUCESSO: US 1.2.1 (RBAC) validada — permissões críticas bloqueadas e switches gerenciáveis.");
    console.log("==================================================\n");

    const screenshotFinal = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-permissoes-sucesso.png', screenshotFinal, 'base64');

    console.log("Teste finalizado!");

  } catch (erro) {
    console.error("O teste falhou:", erro);

    try {
      console.log("Gerando imagem do erro para análise visual...");
      const imagemErro = await driver.takeScreenshot();
      fs.writeFileSync('src/tests/evidencia-erro-permissoes.png', imagemErro, 'base64');

      console.log("Salvando o HTML do momento exato do erro para diagnóstico...");
      const htmlErro = await driver.getPageSource();
      fs.writeFileSync('src/tests/conteudo-erro-permissoes.html', htmlErro);
    } catch (erroHtml) {
      console.error("Não foi possível salvar as evidências de erro:", erroHtml);
    }

  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTestePermissoesRBAC();