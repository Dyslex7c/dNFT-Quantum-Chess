import { 
    createConfig, 
    http, 
    cookieStorage,
    createStorage
  } from 'wagmi'
  import { polygonAmoy } from 'wagmi/chains'
  
  export function getConfig() {
    return createConfig({
      chains: [polygonAmoy],
      ssr: true,
      storage: createStorage({
        storage: cookieStorage,
      }),
      transports: {
        [polygonAmoy.id]: http(),
      },
    })
  }