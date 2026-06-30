// Element-Validierung: OperationalExchange muss ExchangeItem tragen
function OnConnector(theConnector) {
    var result = "";
    if (theConnector.Stereotype == "OperationalExchange") {
        // L3-MK06: ExchangeItem muss verknüpft sein
        if (theConnector.TaggedValues.Count == 0 &&
            !HasConveyedItem(theConnector)) {
            result += "L3-MK06 Verstoß: OperationalExchange '" +
                theConnector.Name + "' hat kein verknüpftes ExchangeItem.\n";
        }
        // L3-MK05: Quelle/Ziel müssen OperationalRole sein
        var src = Repository.GetElementByID(theConnector.ClientID);
        var tgt = Repository.GetElementByID(theConnector.SupplierID);
        if (src.Stereotype != "OperationalRole" || tgt.Stereotype != "OperationalRole") {
            result += "L3-MK05 Verstoß: OperationalExchange verbindet keine OperationalRoles.\n";
        }
    }
    return result;
}

function HasConveyedItem(conn) {
    // Conveyed Items liegen in EA als spezielle MetaType-Relation am Connector
    for (var i = 0; i < conn.EmbeddedElements.Count; i++) {
        if (conn.EmbeddedElements.GetAt(i).Stereotype == "ExchangeItem")
            return true;
    }
    return false;
}