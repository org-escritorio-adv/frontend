/*
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

async function rodarTesteCadastroCliente() {
  console.log("Conectando ao Selenium no Docker para Cadastro de Cliente...");
  
  let options = new chrome.Options();
  options.addArguments('--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage');
  options.windowSize({ width: 1280, height: 800 });

  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .usingServer('http://localhost:4444/wd/hub')
    .build();

  try {
    // ==========================================
    // 1. FLUXO DE LOGIN (Obrigatório para o Keycloak)
    // ==========================================
    console.log("Passo 1: Efetuando login...");
    await driver.get('http://frontend:3000');
    
    await driver.wait(until.elementLocated(By.css('input[type="email"]')), 15000);
    await driver.findElement(By.css('input[type="email"]')).sendKeys('advogado@barcelostakaki.com.br');
    await driver.findElement(By.css('input[type="password"]')).sendKeys('SenhaSegura123');
    await driver.findElement(By.xpath("//button[contains(text(), 'ENTRAR')]")).click();
    
    // Aguarda o redirecionamento para o Dashboard
    await driver.sleep(4000); 

    // ==========================================
    // 2. NAVEGAÇÃO ATÉ A TELA DE CLIENTES
    // ==========================================
    console.log("Passo 2: Navegando para o menu de Clientes...");
    // NOTA: Ajuste o texto do menu conforme o layout real (ex: 'Clientes', 'Gerenciar Clientes')
    let menuClientes = await driver.findElement(By.xpath("//a[contains(., 'Clientes')] | //button[contains(., 'Clientes')]"));
    await menuClientes.click();
    await driver.sleep(2000);

    // ==========================================
    // 3. ABRIR FORMULÁRIO DE NOVO CLIENTE
    // ==========================================
    console.log("Passo 3: Clicando em 'Novo Cliente'...");
    // NOTA: Ajuste o texto do botão conforme a Frente 2 implementar
    let botaoNovoCliente = await driver.findElement(By.xpath("//button[contains(., 'Novo') or contains(., 'Cadastrar')]"));
    await botaoNovoCliente.click();
    await driver.sleep(2000);

    // ==========================================
    // 4. PREENCHER DADOS DO CLIENTE (US 2.5.1)
    // ==========================================
    console.log("Passo 4: Preenchendo formulário de cliente...");
    
    // DICA: Se as inputs não tiverem IDs fáceis, usamos o atributo placeholder ou name
    let inputNome = await driver.findElement(By.css('input[placeholder*="Nome"], input[name="name"], input[name="nome"]'));
    await inputNome.sendKeys('Cliente Teste Automatizado LTDA');

    let inputDocumento = await driver.findElement(By.css('input[placeholder*="CPF"], input[placeholder*="CNPJ"], input[name="documento"]'));
    await inputDocumento.sendKeys('12.345.678/0001-95'); // Exemplo de CNPJ

    // ==========================================
    // 5. SALVAR E VALIDAR (Critério de Aceitação)
    // ==========================================
    console.log("Passo 5: Salvando o cadastro...");
    let botaoSalvar = await driver.findElement(By.xpath("//button[contains(text(), 'Salvar') or contains(text(), 'Confirmar')]"));
    await botaoSalvar.click();
    
    await driver.sleep(3000); // Aguarda resposta do backend

    // Validar se voltou para a listagem ou mostrou toast de sucesso
    let urlAtual = await driver.getCurrentUrl();
    console.log(`URL após salvar: ${urlAtual}`);

    // Tira print do sucesso para a apresentação
    const image = await driver.takeScreenshot();
    fs.writeFileSync('src/tests/evidencia-cadastro-cliente.png', image, 'base64');
    console.log("Teste de cadastro finalizado com sucesso!");

  } catch (erro) {
    console.error("O teste de cadastro falhou:", erro);
    const htmlErro = await driver.getPageSource();
    fs.writeFileSync('src/tests/erro-cadastro-cliente.html', htmlErro);
  } finally {
    await driver.quit();
  }
}

rodarTesteCadastroCliente();
*/