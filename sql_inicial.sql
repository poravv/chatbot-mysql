
CREATE SCHEMA `dbchatbot` ;

CREATE TABLE dbchatbot.pedido (
    idpedido INT AUTO_INCREMENT PRIMARY KEY,
    cliente VARCHAR(255),
    ruc VARCHAR(20),
    idusuario VARCHAR(100) NOT NULL,
    fecha_insercion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) NOT NULL
);

CREATE TABLE dbchatbot.det_pedido (
    iddet_pedido INT AUTO_INCREMENT PRIMARY KEY,
    producto VARCHAR(255),
    cantidad VARCHAR(255),
    idpedido INT,
    FOREIGN KEY (idpedido) REFERENCES pedido(idpedido)
);

create view dbchatbot.vw_pedidos as 
select p.*,
		pd.iddet_pedido,
        pd.producto,
        pd.cantidad
from dbchatbot.pedido p
join dbchatbot.det_pedido pd on pd.idpedido=p.idpedido;

select * from dbchatbot.vw_pedidos;
