import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { PageTitleComponent } from '../page-title.component';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';

@Component({
  selector: 'app-meu-contrato',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzAlertModule, NzDividerModule, PageTitleComponent],
  template: `
    <div class="meu-contrato">
      <app-page-title title="Meu Contrato" subtitle="Contrato de uso, serviço e prestação de serviços online"></app-page-title>

      <nz-alert
        *ngIf="!razao"
        nzType="warning"
        nzMessage="Dados da empresa não encontrados. Faça login novamente."
        nzShowIcon
        style="margin-bottom:16px">
      </nz-alert>

      <nz-card>
        <div class="contrato-body">

          <h2 class="titulo-principal">Contrato Contabilidade on line</h2>
          <h3 class="subtitulo">CONTRATO DE USO, SERVIÇO E PRESTAÇÃO DE SERVIÇOS ONLINE.</h3>

          <p>
            <strong>A CONTFY Serviços contábeis online LTDA</strong>, com sede no município de São Paulo/SP - Capital,
            devidamente inscrita no CNPJ/MF sob nº 22.987.113/0001-65 é uma empresa nacional que atua no ramo de
            serviços online e doravante denominada <strong>CONTFY.</strong> O site é configurado como oferta de serviços
            contábeis não complexos e para o uso de trabalhadores autônomos, microempreendedores individuais e empresas
            enquadradas no Simples Nacional.
          </p>

          <p>
            Ao aceitar o presente Termo de Uso, serviço e prestação de serviço o cliente <strong>{{ razao }}</strong>
            afirma concordar, aderir e ter ciência das condições e regras estabelecidas nesse termo, agindo sempre dentro
            da mais estrita boa-fé e das leis e normas legais que regulam o presente. o cliente <strong>{{ razao }}</strong>
            deverá reler esse Termo de Uso cada vez que contratar novo serviço através do site, uma vez que fica reservado
            para a <strong>CONTFY.COM.BR</strong> o direito de alterar o presente Termo sempre que entender necessário.
          </p>

          <nz-divider></nz-divider>

          <h3>DO USO</h3>

          <p>Ao acessar e contratar os serviços oferecidos o cliente <strong>{{ razao }}</strong> expressa sua concordância e aceita que:</p>

          <ul>
            <li>Deverão obedecer estritamente as normas de uso e serviço.</li>
            <li>Para seu cadastro de acesso o cliente <strong>{{ razao }}</strong> deverá fornecer sua qualificação completa, declarando que concorda em fornecer seus dados de forma correta e atualizada.</li>
            <li>Manter sigilo de todos dados e informações pessoais que tiver conhecimento em razão do acesso concedido.</li>
            <li>Todos os usuários deverão adotar como regra o bom comportamento não sendo tolerados palavras e procedimentos ofensivos.</li>
            <li>Fica terminantemente proibida a utilização de forma antiética, maldosa e de má-fé que possa:
              <ol>
                <li>ameaçar, difamar, ofender ou enganar;</li>
                <li>causar discriminação racial;</li>
                <li>infringir qualquer norma legal;</li>
                <li>atribuir falsa identidade a si próprio ou a outrem.</li>
              </ol>
            </li>
            <li>Fica expressamente vedado e proibido a transmissão de dados ilegais e frutos de aquisição duvidosa.</li>
            <li>É estritamente proibido copiar, duplicar, reproduzir, vender ou dar acesso a terceiros do conteúdo deste site.</li>
            <li>o cliente <strong>{{ razao }}</strong> é totalmente responsável por todos os dados enviados e por mensagens divulgadas, sendo responsável por qualquer ato não autorizado devendo responder criminalmente e civilmente pelos crimes e prejuízos ocasionados.</li>
          </ul>

          <p>
            Fica reservado para o direito de remover e excluir o cliente <strong>{{ razao }}</strong> e seu conteúdo quando
            infringir ao presente Termo de Uso, assim como qualquer outro ato, que após julgamento, a empresa considere
            ofensivo, prejudicial ou que viole qualquer norma legal.
          </p>

          <p>
            <strong>A CONTFY</strong> não se responsabiliza por qualquer conteúdo lançado no site, tanto no cadastro como
            nas mensagens enviadas pelo cliente <strong>{{ razao }}</strong> e a(s) empresa(s) que prestará(ão) serviços
            contábeis, uma vez que todas são fornecidas de forma unilateral imperando a boa-fé.
          </p>

          <p>
            o cliente <strong>{{ razao }}</strong> concorda pelo presente a indenizar a CONTFY e seus prepostos, resultante
            de qualquer infração ou violação ao presente Termo de Uso.
          </p>

          <nz-divider></nz-divider>

          <h3>DOS DIREITOS AUTORAIS E MARCAS REGISTRADAS</h3>

          <p>
            A <strong>CONTFY</strong> é detentora de todos os direitos de uso de marca e imagem divulgada e disponibilizada
            no seu site, estando protegidos pela Lei Civil e de Direito Autorais.
          </p>

          <p>
            É expressamente proibida a reprodução, distribuição, exposição ou transmissão de qualquer conteúdo deste site,
            que não seja autorizado pela <strong>CONTFY</strong>.
          </p>

          <h3>DA CESSAÇÃO DO USO</h3>

          <p>
            A <strong>CONTFY</strong> poderá, sem prévio aviso ou notificação, suspender e cessar o acesso de qualquer
            USUÁRIO ao seu site por suspeita de atividade ilegal, abusiva ou fraudulenta, podendo ainda deletar e remover
            qualquer informação do cliente <strong>{{ razao }}</strong> excluído.
          </p>

          <nz-divider></nz-divider>

          <h3>DA LEGISLAÇÃO APLICADA</h3>

          <p>
            A <strong>CONTFY</strong> está sediada na cidade de São Paulo, sendo, portanto as Leis Brasileiras aplicadas
            para solucionar quaisquer dúvidas com o foro competente o da Capital do Estado de São Paulo.
          </p>

          <nz-divider></nz-divider>

          <h3>DA POLÍTICA DE PRIVACIDADE</h3>

          <p>
            Nós, da <strong>CONTFY</strong> estamos comprometidos em resguardar sua privacidade. O intuito deste item é
            esclarecer quais informações são coletadas dos usuários da <strong>CONTFY</strong> – e respectivos serviços –
            e de que forma esses dados são manipulados e utilizados.
          </p>

          <p>
            Alertamos que se você não concorda com o conteúdo desta política, não é recomendável realizar seu cadastro
            nem utilizar quaisquer de nossos serviços.
          </p>

          <h4>1. Dados Fornecidos</h4>
          <p>
            Em nossos sites, as informações são coletadas das seguintes formas: Informações fornecidas por você –
            Coletamos informações de identificação pessoal – como nome, telefone, e-mail, CPF ou CNPJ – via preenchimento
            dos formulários para download de nossos conteúdos.
          </p>
          <p>
            Eventualmente, algumas informações podem ser feitas por meio de contato direto da <strong>CONTFY</strong>
            com os usuários via e-mail ou telefone.
          </p>

          <h4>2. Informações sobre cookies e de navegação no site</h4>
          <p>
            Quando você visita nosso site, é inserido um 'cookie' no seu navegador, desse modo é possível identificar o
            cliente <strong>{{ razao }}</strong> no retorno a <strong>CONTFY</strong>. Sem o cookie você deveria se
            cadastrar de novo todas as vezes que acessasse as nossas plataformas. São coletadas, informações, como
            endereço IP, localização geográfica, fonte de referência, tipo de navegador, duração da visita e páginas visitadas.
          </p>

          <h4>3. Proteção das Informações</h4>
          <p>O site é seguro para efetuar todo e qualquer pagamento ou acessar e enviar suas informações.</p>
          <p>O servidor é seguro e usamos a tecnologia padrão segura de proteção de dados.</p>

          <h4>4. Histórico de contato</h4>
          <p>
            Aqui na <strong>CONTFY</strong> armazenamos informações a respeito de todos os contatos já realizados com
            nossos usuários, como conteúdos baixados a partir de nossas páginas e interações via email.
          </p>

          <h4>5. Regras para a troca de informações e contato</h4>
          <p>
            A <strong>CONTFY</strong> disponibiliza na sua plataforma todos os meios necessários para que os usuários
            possam realizar a devida comunicação e negociação sobre os serviços contratados e em andamento.
          </p>

          <h4>6. Sobre o uso de suas Informações Pessoais</h4>
          <p>
            O e-mail é utilizado para a operação de envio do material ou informação por você requisitada no preenchimento
            do formulário.
          </p>
          <p>
            Por fim, o email será utilizado ainda para comunicar o lançamento de novos serviços ou de novos produtos da
            <strong>CONTFY</strong> e parceiros. No entanto, o cliente <strong>{{ razao }}</strong> pode cancelar a
            assinatura a qualquer momento.
          </p>
          <p>
            Os dados de download poderão ser divulgados como pesquisas e estatísticas, não sendo reveladas abertamente
            nenhuma informação pessoal, a menos que autorizada explicitamente.
          </p>
          <p>
            Funcionários da <strong>CONTFY</strong> poderão eventualmente entrar em contato via email ou telefone para
            fazer pesquisas ou apresentar produtos e serviços.
          </p>
          <p>
            Ao solicitar um serviço, o cliente <strong>{{ razao }}</strong> recebe um termo de adesão/contrato que
            especifica a contratação, formas e valor a ser pago, bem como sua política de privacidade e o sigilo com que
            serão tratadas essas informações.
          </p>
          <p>
            Suas informações pessoais serão compartilhadas com nossos parceiros apenas quando a parceria estiver explícita
            na página onde consta o formulário para o recebimento de conteúdo.
          </p>

          <h4>7. Acesso às suas informações pessoais:</h4>
          <p>
            Poderão ver suas informações pessoais apenas funcionários da <strong>CONTFY</strong>. Eventualmente, caso a
            inserção de suas informações se dê em ações criadas em parcerias, os parceiros explicitamente identificados
            também terão acesso à informação. Nenhuma informação pessoal poderá ser divulgada publicamente. A
            <strong>CONTFY</strong> também se compromete a não vender, alugar ou repassar suas informações para terceiros.
            A única exceção está em casos em que essas informações forem exigidas judicialmente.
          </p>
          <p>
            Além disso, embora trabalhemos com boas práticas de proteção e segurança, nenhum serviço web possui 100% de
            garantia contra invasões e não podemos nos responsabilizar caso isso ocorra.
          </p>

          <h4>8. Mudanças na Política de Privacidade</h4>
          <p>
            Essa Política de Privacidade pode passar por atualizações. Desta forma, recomendamos visitar periodicamente
            esta página para que você tenha conhecimento sobre as modificações.
          </p>
          <p>
            Antes de usar informações para outros fins que não os definidos nesta Política de Privacidade, solicitaremos
            sua autorização.
          </p>

          <nz-divider></nz-divider>

          <h3>DA PRESTAÇÃO DE SERVIÇO</h3>

          <p>
            A <strong>CONTFY</strong>, qualificada acima, será doravante denominada simplesmente CONTRATADA, e a pessoa
            física ou jurídica identificada no cadastramento do banco de dados eletrônico, doravante denominado
            simplesmente CONTRATANTE, além de aceitar o termo de uso celebram o presente contrato, mediante as cláusulas
            e condições abaixo:
          </p>

          <p>
            O CONTRATANTE declara e garante possuir capacidade jurídica para celebrar este contrato, devendo ter a
            maioridade civil de 18 anos e ser capaz para contratar.
          </p>
          <p>
            Para a validade do presente contrato o cadastro do CONTRATANTE deverá ter sido preenchido com todas as
            informações necessárias.
          </p>
          <p>
            Quando do cadastramento o CONTRATANTE usará o seu e-mail pessoal para acesso ("login") e uma senha
            ("password"), e informará todos os dados necessários, responsabilizando-se civil e criminalmente pelas
            informações prestadas, autorizando A <strong>CONTFY</strong> confirma os dados utilizando, se necessário,
            de terceiros, para a devida validação dos dados cadastrais.
          </p>
          <p>
            O objeto do presente é a contratação de serviços contábeis 100% (cem por cento) on line, dentro daqueles
            previamente oferecidos no site da CONTRATADA para atender a necessidade do ora CONTRATANTE e USUÁRIO mediante
            a paga dos serviços, taxas e comissão.
          </p>
          <p>Com o aceite ficará pactuado o contrato de prestação de serviço com as condições, preço e obrigações narradas abaixo.</p>

          <p>
            <strong>PRAZO.</strong> O prazo do contrato será indeterminado, com pagamento mensal e no caso da intenção
            da rescisão ou interrupção, deverá o CONTRATANTE expressar sua intenção pelo canal oferecido no site, com o
            prazo de aviso prévio de 30 dias.
          </p>

          <p>
            <strong>PRESTAÇÃO DOS SERVIÇOS.</strong> Os serviços técnicos contábeis serão prestado pela
            <strong>CONTFY SERVIÇOS CONTABEIS LTDA</strong> a qual está devidamente cadastrada junto ao CRC e possui
            qualificação técnica para tanto.
          </p>

          <p>
            <strong>GARANTIA.</strong> Toda garantia do serviço será prestada diretamente pela empresa acima, responsável
            técnico, não se responsabilizando a <strong>CONTFY</strong> pela realização do serviço e dependerá sempre das
            informações prestadas pelo CONTRATANTE.
          </p>

          <p>
            <strong>DO VALOR.</strong> Todo e qualquer pagamento dos serviços contratados deverá ser realizado diretamente
            para a <strong>CONTFY</strong> na forma disponibilizada via sistema de cobrança entre outros.
          </p>

          <p>
            Quando da contratação do serviço o cliente <strong>{{ razao }}</strong> ora CONTRATANTE realizará o pagamento
            do valor orçado no campo "Valor a Pagar".
          </p>

          <p>
            Na hipótese do serviço não ser concluído, os valores retornarão parcialmente para o CONTRATANTE, sendo que
            dentro dos primeiros 7 dias, serão estornados integralmente e após este prazo será estornado o valor do
            serviço, retendo a taxa de pagamento em razão da contratação de terceiros.
          </p>

          <p>
            Não ocorrendo o pagamento, seja por qualquer motivo, o cadastro do CONTRATANTE será suspenso e o serviço
            interrompido, devendo os prejuízos ser ressarcidos.
          </p>

          <p>
            A <strong>CONTFY</strong> não é responsável por qualquer informação prestada pelos usuários do site, mesmo
            na hipótese de tal informação ser difamatória, uma vez que não monitora ou exerce censura no conteúdo
            lançado e cadastrado por seus usuários, devendo sempre imperar a conduta da boa-fé e da confiabilidade nos
            exatos termos do Termo de Uso e Politica de Privacidade.
          </p>

          <p>
            No entanto, constatando o abuso, poderá a <strong>CONTFY</strong> remover, deletar ou restringir o acesso ao
            site, após considerar que o conteúdo viola o presente contrato.
          </p>

          <p>
            Havendo necessidade, após qualquer parte se sentir prejudicada, seja a que título for, a
            <strong>CONTFY</strong> deixa aberto canal de comunicação
            <a href="mailto:contato&#64;contfy.com.br">contato&#64;contfy.com.br</a> onde poderá receber notificações,
            queixas e até mesmo sugestões.
          </p>

          <p>
            Os serviços solicitados deverão ser descritos com exatidão, podendo a critério da <strong>CONTFY</strong>
            ser solicitado maiores detalhes técnicos ou ser excluído por falta de dados.
          </p>

          <p>
            o cliente <strong>{{ razao }}</strong> aceita e concorda, se necessário, fornecer dados e informações técnicas
            contábeis quando solicitado pelo prestador de serviço, sempre usando os canais de comunicação do site.
          </p>

          <p>Após a realização do serviço o CONTRATANTE poderá ofertar seu comentário através do endereço de comunicação.</p>

          <nz-divider></nz-divider>

          <h3>DAS CONDIÇÕES DA PRESTAÇÃO DE SERVIÇO</h3>

          <ol>
            <li>
              <strong>O CONTRATANTE reconhece e esta ciente que a CONTFY realiza tão somente, através de seu site, os
              serviços contábeis lá ofertados, não participando de nenhum Contrato de Serviço direto com o cliente
              {{ razao }} tomador de serviço, não exercendo nenhum vinculo empregatício e não tem poderes e nem garante
              a veracidade das informações prestadas pelos CONTRATANTES usuários e prestadores de serviços.</strong>
            </li>
            <li>
              O presente termo esta fundamentado no que dispõe as <strong>resoluções 942/2002 e 987/2003 do Conselho
              Federal de Contabilidade</strong>.
            </li>
            <li>
              DAS OBRIGAÇÕES DO CONTRATANTE:
              <ul>
                <li>O CONTRATANTE é exclusivamente responsável pelas obrigações fiscais e tributários, originadas da presente relação comercial.</li>
                <li>A remuneração contratada deverá ser paga exclusivamente através da plataforma da <strong>CONTFY</strong>.</li>
                <li>Prestadores de serviços R$ 79,90 mensal</li>
                <li>MEI microempreendedor individual R$ 49,90 mensal ou também poderá aderir ao plano anual com o desconto de duas mensalidades.</li>
                <li>Prestadores/comercio R$ 99,00</li>
                <li>Os honorários serão reajustados anualmente e automaticamente segundo a variação do IGP-M no período, considerando-se como mês a fração igual ou superior a 15 (quinze) dias.</li>
                <li>Serviços extras como abertura de empresa sem a contratação de um de nossos planos será cobrado a parte;</li>
                <li>Baixa de CNPJ;</li>
                <li>Alterações contratuais;</li>
                <li>
                  Transformação de empresas MEI para ME ou outras, todos esses serviços poderá ser visualizado a tabela
                  de preços no site da CONTFY.COM.BR ou solicite um orçamento
                  <a href="mailto:gilvan&#64;contfy.com">gilvan&#64;contfy.com</a>
                </li>
                <li>
                  Ao optar pela abertura da empresa gratuitamente é necessário que assine um dos nossos planos, o setor
                  de abertura de empresas da <strong>CONTFY</strong> vai elaborar o processo formulários dos órgãos
                  necessário, e enviará no endereço que foi cadastrado no site da <strong>CONTFY</strong> a seus cuidados
                  para que possa efetuar o pagamento das taxas do governo assinar nos devidos campos e protocolar na JUCESP
                  mais próxima da sua residência, tendo assim que guardar o protocolo para retirada do processo conforme
                  data prevista pela Junta Comercial na qual foi protocolado o processo de abertura da empresa, após este
                  tramite o USUARIO devera enviar à CONTFY o numero do CNPJ e data de abertura para que seja elaborado
                  processo de entrada junto a Prefeitura de seu município e respectiva senhas.
                </li>
                <li>A rescisão do contrato poderá ocorrer a qualquer momento, desde que concedido o aviso prévio de 30 dias, responsabilizando-se a parte denunciante aos eventuais prejuízos ocasionados.</li>
                <li>É de inteira responsabilidade do CONTRATANTE a atualização de seus dados e cadastros realizados no site da <strong>CONTFY.</strong></li>
                <li>Deverá mensalmente:
                  <ul>
                    <li>a) anexar no site as informações solicitadas;</li>
                    <li>b) acessar o site e baixar as guias e extratos e quando necessário as guias de impostos na qual será enviada automaticamente pela CONTFY.</li>
                    <li>a eventualidade do site estar fora do ar é responsabilidade do CONTRATANTE enviar a documentação em tempo hábil pelo e-mail <a href="mailto:contato&#64;contfy.com.br">contato&#64;contfy.com.br.</a></li>
                    <li>A guarda dos documentos físicos em conformidade com a legislação vigente é de responsabilidade do CONTRATANTE.</li>
                  </ul>
                </li>
                <li>A <strong>CONTFY</strong> não se responsabiliza pelo pagamento dos impostos do CONTRATANTE, nem por eventuais multas e juros decorrente do atraso do envio das informações por parte do CONTRATADO.</li>
              </ul>
            </li>
            <li>
              DAS OBRIGAÇÕES DO CONTRATADO:
              <ul>
                <li>
                  O CONTRATADO se compromete a disponibilizar as guias de pagamento dos impostos em até 10 dias após o
                  upload das informações por parte do CONTRATANTE. Ressalta-se que, caso esse prazo seja insuficiente para
                  cumprir os prazos legais de vencimento dos tributos, o CONTRATANTE será o único responsável pelo
                  pagamento das multas e juros por atraso no pagamento do imposto. Qualquer esforço por parte do
                  CONTRATADO para entregar as guias antes do prazo referido não se constitui em obrigação futura, sendo
                  mera liberalidade do mesmo.
                </li>
                <li>O CONTRATADO se obriga a fornecer ao CONTRATADO optante pelo Simples Nacional o Balanço Anual até o dia 31 de março do ano subsequente.</li>
                <li>O CONTRATADO se responsabiliza pela entrega das obrigações acessórias descritas abaixo dentro do prazo legal, desde que o CONTRATANTE envie as informações necessárias em tempo hábil. MEI:</li>
              </ul>
              <div style="margin-left:24px">
                <p><strong>MEI:</strong></p>
                <ul>
                  <li>Declaração Anual do MEI (DASN/SIMEI)</li>
                  <li>Informe de rendimentos</li>
                </ul>
                <p><strong>Simples Nacional:</strong></p>
                <ul>
                  <li>GFIP</li>
                  <li>Declaração Anual do Simples Nacional (DASN) RAIS Negativa</li>
                  <li>Informe de rendimentos</li>
                </ul>
                <p><strong>Médicos e Autônomos:</strong></p>
                <ul>
                  <li>Arquivo do carnê-leão a ser importado na Declaração de Imposto de Renda de Pessoa Física (DIRPF)</li>
                </ul>
                <p>Em nenhum caso está incluída a entrega da Declaração de Imposto de Renda de Pessoa Física (DIRPF).</p>
              </div>
            </li>
            <li>Não terá validade nenhum outro acordo ou acertos que eventualmente for mantido fora deste contrato.</li>
            <li>O presente contrato apresenta todo entendimento havido entre as partes, cancelando quaisquer discussões ou acordos verbais mantidos anteriormente.</li>
            <li>O CONTRATANTE consente a utilização do correio eletrônico/e-mail fornecido e cadastrado como único meio de comunicação entre as partes e para o envio de notificações relacionadas ao presente contrato.</li>
            <li>A não conclusão de qualquer parte deste contrato não constitui renúncia ao direito e não deve afetar o direito de exercê-la posteriormente.</li>
            <li>É expressamente vedado a cessão do presente contrato mesmo que parcial.</li>
            <li>Na eventualidade de parte do presente contrato for considerada ilegal, inválida, ou inexequível, pela lei aplicável ou decisão judicial, as demais cláusulas e condições permanecerão inalteradas.</li>
            <li>Para dirimir eventuais controvérsias ou dúvidas a respeito do presente contrato fica eleito o foro da cidade de São Paulo, Capital.</li>
          </ol>

          <nz-divider></nz-divider>

          <p>
            Contato com o <strong>CONTFY</strong> para esclarecimento de dúvidas:
          </p>
          <p>
            Qualquer dúvida em relação à nossa política de privacidade pode ser esclarecida entrando em contato conosco.
          </p>
          <p>
            Envie um email para: <a href="mailto:contato&#64;contfy.com.br">contato&#64;contfy.com.br</a>
          </p>

        </div>
      </nz-card>
    </div>
  `,
  styles: [`
    .meu-contrato { padding: 8px 4px; }
    .contrato-body {
      font-family: Arial, sans-serif;
      font-size: 13px;
      color: #515356;
      line-height: 1.7;
      text-align: justify;
    }
    .titulo-principal {
      font-size: 20px;
      font-weight: bold;
      color: #515356;
      margin-bottom: 4px;
    }
    .subtitulo {
      font-size: 13px;
      font-weight: bold;
      color: #515356;
      margin-bottom: 16px;
    }
    h3 {
      font-size: 13px;
      font-weight: bold;
      color: #515356;
      margin-top: 12px;
    }
    h4 {
      font-size: 13px;
      font-weight: bold;
      color: #515356;
      margin-top: 10px;
    }
    p { margin-bottom: 8px; }
    ul, ol { margin: 8px 0 8px 24px; }
    li { margin-bottom: 4px; }
    a { color: #1890ff; }
  `]
})
export class MeuContratoComponent implements OnInit {
  razao = '';

  constructor(private loginService: LoginService, private router: Router) {}

  ngOnInit(): void {
    const pessoa = this.loginService.obterPessoa();
    if (!pessoa?.codigo) {
      this.loginService.logout();
      this.router.navigate(['/login']);
      return;
    }
    this.razao = pessoa.razao || pessoa.nome || '';
  }
}
