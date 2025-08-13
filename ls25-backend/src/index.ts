import express from 'express';
import cors from 'cors';
import { db } from './database';
import { calculateChain, calculateRevenue, calculateCapacityAnalysis, calculateProcessingTime } from './calculations';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["*"],
  allowedHeaders: ["*"]
}));

app.use(express.json());

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/waren', (req, res) => {
  try {
    const waren = db.getAllWaren();
    res.json(waren);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/waren', (req, res) => {
  try {
    const ware = db.createWare(req.body);
    res.json(ware);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/waren/:ware_id', (req, res) => {
  try {
    const ware = db.updateWare(req.params.ware_id, req.body);
    if (!ware) {
      return res.status(404).json({ error: 'Ware not found' });
    }
    res.json(ware);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/waren/:ware_id', (req, res) => {
  try {
    const deleted = db.deleteWare(req.params.ware_id);
    if (!deleted) {
      return res.status(404).json({ error: 'Ware not found' });
    }
    res.json({ message: 'Ware deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/produktionen', (req, res) => {
  try {
    const produktionen = db.getAllProduktionen();
    res.json(produktionen);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/produktionen', (req, res) => {
  try {
    const produktion = db.createProduktion(req.body);
    res.json(produktion);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/produktionen/:produktion_id', (req, res) => {
  try {
    const produktion = db.updateProduktion(req.params.produktion_id, req.body);
    if (!produktion) {
      return res.status(404).json({ error: 'Produktion not found' });
    }
    res.json(produktion);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/produktionen/:produktion_id', (req, res) => {
  try {
    const deleted = db.deleteProduktion(req.params.produktion_id);
    if (!deleted) {
      return res.status(404).json({ error: 'Produktion not found' });
    }
    res.json({ message: 'Produktion deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/gebaeude', (req, res) => {
  try {
    const gebaeude = db.getAllGebaeude();
    res.json(gebaeude);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/gebaeude', (req, res) => {
  try {
    const gebaeude = db.createGebaeude(req.body);
    res.json(gebaeude);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/gebaeude/:gebaeude_id', (req, res) => {
  try {
    const gebaeude = db.updateGebaeude(req.params.gebaeude_id, req.body);
    if (!gebaeude) {
      return res.status(404).json({ error: 'Gebäude not found' });
    }
    res.json(gebaeude);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/gebaeude/:gebaeude_id', (req, res) => {
  try {
    const deleted = db.deleteGebaeude(req.params.gebaeude_id);
    if (!deleted) {
      return res.status(404).json({ error: 'Gebäude not found' });
    }
    res.json({ message: 'Gebäude deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/calculate/chain', (req, res) => {
  try {
    const { start_good_id, quantity } = req.body;
    const result = calculateChain(start_good_id, quantity);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/calculate/revenue', (req, res) => {
  try {
    const { production_chain, runtime_months = 1.0 } = req.body;
    const result = calculateRevenue(production_chain, runtime_months);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calculate/capacity/:production_id', (req, res) => {
  try {
    const result = calculateCapacityAnalysis(req.params.production_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calculate/processing-time/:cycles_per_month', (req, res) => {
  try {
    const cyclesPerMonth = parseFloat(req.params.cycles_per_month);
    const result = calculateProcessingTime(cyclesPerMonth);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/export', (req, res) => {
  try {
    const waren = db.getAllWaren();
    const produktionen = db.getAllProduktionen();
    const gebaeude = db.getAllGebaeude();
    
    res.json({
      waren,
      produktionen,
      gebaeude
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/import', (req, res) => {
  try {
    const { waren = [], produktionen = [], gebaeude = [], merge = true } = req.body;
    
    if (!merge) {
      db.clearAllData();
    }
    
    for (const wareData of waren) {
      if (merge) {
        const existing = db.getAllWaren().find(w => w.name === wareData.name);
        if (existing) continue;
      }
      db.createWare(wareData);
    }
    
    for (const produktionData of produktionen) {
      if (merge) {
        const existing = db.getAllProduktionen().find(p => p.name === produktionData.name);
        if (existing) continue;
      }
      db.createProduktion(produktionData);
    }
    
    for (const gebaeudeData of gebaeude) {
      if (merge) {
        const existing = db.getAllGebaeude().find(g => g.name === gebaeudeData.name);
        if (existing) continue;
      }
      db.createGebaeude(gebaeudeData);
    }
    
    res.json({ message: 'Data imported successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`LS25 Backend server running on port ${PORT}`);
});
