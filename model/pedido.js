const { DataTypes } = require('sequelize');
const sequelize = require('../dbConfig');

const Pedido = sequelize.define('Pedido', {
  idpedido: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  cliente: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ruc: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fecha_insercion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'pedido',
  timestamps: false
});

const DetPedido = sequelize.define('DetPedido', {
    iddet_pedido: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    producto: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    idpedido: {
      type: DataTypes.INTEGER,
      references: {
        model: Pedido,
        key: 'idpedido'
      }
    }
  }, {
    tableName: 'det_pedido',
    timestamps: false
  });
  
  Pedido.hasMany(DetPedido, { foreignKey: 'idpedido' });
  DetPedido.belongsTo(Pedido, { foreignKey: 'idpedido' });
  
  module.exports = { Pedido, DetPedido };