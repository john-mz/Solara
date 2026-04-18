// Para efectos de la Hackathon y facilidad de uso, usaremos process.env.
// La API Key (tk_TU_API_KEY) debe estar configurada en el entorno (ej. archivo .env o en Firebase config).

export const config = {
  // La URL base del middleware oficial de la hackathon
  API_BASE_URL: process.env.API_BASE_URL || 'https://techos.thetribu.dev',
  
  // El Token proporcionado al equipo
  API_KEY: process.env.API_KEY || 'tk_TU_API_KEY', // Reemplazar en el entorno real
  
  // Umbrales para alarmas
  THRESHOLDS: {
    FREQUENCY_MIN_HZ: 54,
    FREQUENCY_MAX_HZ: 66,
    // El voltaje puede depender de la instalación, pero definimos un rango por defecto (ej. red a 120V)
    VOLTAGE_MIN_V: 108,  // -10% de 120V
    VOLTAGE_MAX_V: 132,  // +10% de 120V
  }
};
