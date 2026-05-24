import svgPaths from "./svg-itc0dxltwr";
import imgLogo1 from "./c94d0251b0fd23670e2fa6c6fa526ecff71beb6f.png";

function Heading() {
  return (
    <div className="h-[36px] relative shrink-0 w-full" data-name="Heading 1">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[36px] left-0 not-italic text-[#1a2b3c] text-[24px] top-[-0.5px] whitespace-nowrap">{`Barcelos & Takaki`}</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#62748e] text-[14px] top-[0.5px] whitespace-nowrap">Sistema de Gerenciamento Legal</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[56px] relative shrink-0 w-[179.583px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Heading />
        <Paragraph />
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#c5a059] h-[40px] relative rounded-[4px] shrink-0 w-[136.833px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Montserrat:Medium',sans-serif] font-medium leading-[24px] left-[68px] text-[#121212] text-[13px] text-center top-[8.5px] whitespace-nowrap">Área Pública</p>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="bg-white h-[64px] relative shrink-0 w-[1551px]" data-name="TopBar">
      <div aria-hidden="true" className="absolute border-[#e5e7eb] border-b border-solid inset-0 pointer-events-none shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between pb-px px-[32px] relative size-full">
        <Container1 />
        <Button />
      </div>
    </div>
  );
}

function Heading1() {
  return (
    <div className="h-[30px] relative shrink-0 w-full" data-name="Heading 2">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[30px] left-1/2 not-italic text-[#1a2b3c] text-[20px] text-center top-[calc(50%-15px)] w-[344px]">Recupere sua senha</p>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-[172px] not-italic text-[#45556c] text-[16px] text-center top-[-1px] w-[344px]">Digite seu e-mail e receba um link para redefinição de senha</p>
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8px] h-[62px] items-start left-[9.5px] right-[9.5px] top-[36px]" data-name="Container">
      <Heading1 />
      <Paragraph1 />
    </div>
  );
}

function Button1() {
  return (
    <div className="absolute bg-[#1a2b3c] h-[32px] left-[107px] rounded-[10px] top-[226px] w-[149px]" data-name="Button">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[74px] not-italic text-[16px] text-center text-white top-[4px] w-[148px]">Recuperar senha</p>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="absolute h-[320px] left-[594px] top-[297px] w-[363px]" data-name="Dashboard">
      <Container3 />
      <Button1 />
      <div className="absolute h-[43px] left-[9.5px] top-[144px] w-[344px]">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 344 43">
          <path d={svgPaths.p23cd0870} fill="var(--fill-0, #D9D9D9)" id="Rectangle 2" />
        </svg>
      </div>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-[31.5px] not-italic text-[#45556c] text-[16px] top-[153px] w-[322px]">E-mail</p>
      <div className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-[181.5px] not-italic text-[#45556c] text-[16px] text-center top-[278px] w-[363px]">
        <p className="leading-[24px] mb-0">ou</p>
        <p className="decoration-solid leading-[24px] underline">faça login</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="bg-[#f6f5f5] flex-[849_0_0] min-h-px relative w-[1551px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <Dashboard />
        <div className="absolute h-[162px] left-[639px] top-[87px] w-[273px]" data-name="logo 1">
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 overflow-hidden">
              <img alt="" className="absolute h-[211.2%] left-[-185.6%] max-w-none top-[-45.21%] w-[285.52%]" src={imgLogo1} />
            </div>
            <div className="absolute inset-0 overflow-hidden">
              <img alt="" className="absolute h-[211.2%] left-[-185.6%] max-w-none top-[-45.21%] w-[285.52%]" src={imgLogo1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="flex-[1471_0_0] h-[913px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <TopBar />
        <Container2 />
      </div>
    </div>
  );
}

export default function RecuperacaoDeSenha() {
  return (
    <div className="bg-[#f8fafc] content-stretch flex items-start relative size-full" data-name="Recuperação de senha">
      <Container />
    </div>
  );
}