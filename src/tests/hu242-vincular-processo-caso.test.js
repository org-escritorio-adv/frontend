import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

const TITULO_CARD = 'teste';

async function rodarTesteVinculoProcesso() {
  console.log("Conectando ao Selenium no Docker...");

  let options = new chrome.Options();
  options.addArguments('--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage');
  options.windowSize({ width: 1400, height: 900 });

  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .usingServer('http://selenium-chrome:4444/wd/hub')
    .build();

  try {
    // =========================================================================
    // 0 - LOGIN E NAVEGAÇÃO ATÉ O KANBAN
    // =========================================================================
    await driver.get('https://escritorio-adv-two.vercel.app/');
    let seletorAreaAdvogado = By.xpath("//button[contains(text(), 'Área do Advogado')] | //a[contains(text(), 'Área do Advogado')]");
    await (await driver.wait(until.elementLocated(seletorAreaAdvogado), 15000)).click();
    await driver.sleep(2000);

    let campoEmail = await driver.wait(until.elementLocated(By.css('input[type="email"], input[name="email"]')), 15000);
    await campoEmail.sendKeys('admin@escritorio.com');
    await (await driver.findElement(By.css('input[type="password"], input[name="password"]'))).sendKeys('admin123');
    await (await driver.findElement(By.xpath("//button[contains(text(), 'ENTRAR') or contains(text(), 'Entrar')]"))).click();
    
    let seletorMenuCasos = By.xpath("//*[self::button or self::a][.//text()[contains(., 'Casos')] or contains(text(), 'Casos')]");
    await (await driver.wait(until.elementLocated(seletorMenuCasos), 15000)).click();
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Gestão de Casos')]")), 15000);
    await driver.sleep(3000);

    // =========================================================================
    // 1 - ABRIR O DETALHE DO CASO (GAVETA LATERAL)
    // =========================================================================
    console.log(`Buscando o card: "${TITULO_CARD}"...`);
    // Localiza o elemento h4 interno ao card
    let elementoTituloCard = await driver.wait(until.elementLocated(By.xpath(`//h4[contains(text(), "${TITULO_CARD}")]`)), 10000);
    
    console.log("Forçando o clique no card via script para garantir abertura...");
    // Clicar via ExecuteScript mitiga problemas se o card estiver semi-oculto pelo scroll do Kanban
    await driver.executeScript("arguments[0].click();", elementoTituloCard);
    
    // Aguarda a gaveta lateral estar visível validando o texto do título em qualquer elemento (//*)
    console.log("Aguardando a gaveta lateral carregar o título do caso...");
    let seletorTituloGaveta = By.xpath(`//div[contains(@class, 'fixed') or contains(@class, 'shadow')]//*[contains(text(), "${TITULO_CARD}")] | //*[contains(text(), "${TITULO_CARD}")]`);
    await driver.wait(until.elementLocated(seletorTituloGaveta), 15000);
    console.log("OK: Gaveta de detalhes detectada na tela.");
    await driver.sleep(1500); // Pausa estratégica para renderização dos componentes internos da gaveta

    // =========================================================================
    // 2 - SELECIONAR E VINCULAR O PROCESSO
    // =========================================================================
    console.log("Buscando o seletor 'Vincular processo...'...");
    
    // Alvo: O container ou o texto que representa o select visível no rodapé
    let seletorInstanciaSelect = By.xpath("//*[contains(text(), 'Vincular processo...')] | //select | //input[contains(@placeholder, 'Vincular')]");
    let elementoSelect = await driver.wait(until.elementLocated(seletorInstanciaSelect), 10000);
    
    console.log("Clicando no campo select para expandir as opções...");
    await elementoSelect.click();
    await driver.sleep(2000); // Tempo necessário para o dropdown disparar e listar os processos cadastrados

    console.log("Capturando e selecionando a primeira opção de processo disponível...");
    // Busca por uma tag <option> ou elementos de lista visíveis que não sejam o placeholder inicial
    let seletorOpcoes = By.xpath("//option[not(@disabled) and not(contains(text(), 'Vincular'))] | //*[contains(@class, 'option') or contains(@class, 'menu')]//*[contains(text(), '.')]");
    let opcaoDisponivel = await driver.wait(until.elementLocated(seletorOpcoes), 10000);
    
    let numeroDoProcesso = await opcaoDisponivel.getText();
    console.log(`Selecionando o processo encontrado: "${numeroDoProcesso}"`);
    await opcaoDisponivel.click();
    await driver.sleep(1000);

    console.log("Clicando no botão 'Vincular' para confirmar...");
    let botaoConfirmarVincular = await driver.wait(until.elementLocated(By.xpath("//button[normalize-space(text())='Vincular']")), 10000);
    await botaoConfirmarVincular.click();
    await driver.sleep(3000); // Aguarda o envio do formulário / requisição

    console.log(`\n==================================================`);
    console.log(`SUCESSO: Clique no botão Vincular executado!`);
    console.log(`==================================================\n`);

  } finally {
    console.log("Fechando o navegador...");
    await driver.quit();
  }
}

rodarTesteVinculoProcesso();