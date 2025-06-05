# Wake Lock - Tela Sempre Ativa

## 🔋 Funcionalidade Implementada

Esta funcionalidade garante que a tela do dispositivo (especialmente celulares) **não desligue automaticamente** enquanto o timer do Pomodoro estiver rodando.

## 🚀 Como Funciona

### Wake Lock API
- Utiliza a **Wake Lock API** moderna do navegador
- Mantém a tela ativa apenas quando o timer está **executando**
- Libera automaticamente o bloqueio quando o timer é **pausado**, **resetado** ou **finalizado**

### Comportamento Inteligente
- ✅ **Ativa** quando você inicia o timer
- ⏸️ **Desativa** quando você pausa o timer
- 🔄 **Desativa** quando você reseta o timer
- 🏁 **Desativa** quando o timer termina
- 🔀 **Desativa** quando você muda de modo (Pomodoro/Pausa)

### Recuperação Automática
- Se você minimizar a página e voltar durante um timer ativo, o Wake Lock é **reativado automaticamente**
- Gerencia automaticamente situações onde o Wake Lock pode ser perdido

## 📱 Compatibilidade

### Navegadores Suportados
- ✅ Chrome/Chromium 84+
- ✅ Edge 84+
- ✅ Opera 70+
- ✅ Chrome para Android 84+
- ❌ Safari (não suportado ainda)
- ❌ Firefox (não suportado ainda)

### Fallback
- Para navegadores não compatíveis, a funcionalidade é **ignorada silenciosamente**
- O aplicativo continua funcionando normalmente
- Logs no console informam sobre o status do Wake Lock

## 🔧 Implementação Técnica

### Principais Funções Adicionadas

```javascript
// Solicitar Wake Lock
async function requestWakeLock()

// Liberar Wake Lock
async function releaseWakeLock()

// Recuperar Wake Lock quando a página volta ao foco
async function handleVisibilityChange()
```

### Estado Gerenciado
```javascript
let timerState = {
    // ...outros estados...
    wakeLock: null // Armazena a instância do Wake Lock
};
```

## 🎯 Benefícios para o Usuário

1. **📱 Mobile-Friendly**: Perfeito para usar no celular durante sessões de Pomodoro
2. **🔋 Economia de Bateria**: Wake Lock é liberado automaticamente quando não necessário
3. **⚡ Automático**: Funciona transparentemente, sem necessidade de configuração
4. **🛡️ Seguro**: Não interfere com outras aplicações ou sistema

## 🔍 Verificação

Para verificar se está funcionando:

1. **Abra o Console do Navegador** (F12)
2. **Inicie um timer**
3. **Procure pela mensagem**: `"Wake Lock ativado - tela permanecerá ligada"`
4. **Pause/Reset o timer**
5. **Procure pela mensagem**: `"Wake Lock liberado"`

## ⚠️ Observações Importantes

- O Wake Lock só funciona quando a página está **em foco/visível**
- Se a página ficar em segundo plano por muito tempo, o sistema pode liberar o Wake Lock
- A funcionalidade é **reativada automaticamente** quando você volta à página
- Não funciona se o dispositivo estiver com bateria muito baixa (comportamento do sistema)

## 🔧 Para Desenvolvedores

O código foi implementado de forma **não intrusiva**:
- Não quebra a funcionalidade existente
- Degrada graciosamente em navegadores não compatíveis
- Usa async/await para melhor gerenciamento de erros
- Inclui logs para debug

Esta implementação torna o app Pomodoro muito mais útil para uso mobile, especialmente durante sessões longas de trabalho ou estudo! 🎉
