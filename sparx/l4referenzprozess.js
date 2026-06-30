function OnConnector_Implements(theConnector) {
    var result = "";
    if (theConnector.Stereotype == "Implements") {
        var src = Repository.GetElementByID(theConnector.ClientID);
        var tgt = Repository.GetElementByID(theConnector.SupplierID);
        var validTypes = ["OperationalActivity", "OperationalActivityAction"];

        if (validTypes.indexOf(src.Stereotype) == -1 ||
            validTypes.indexOf(tgt.Stereotype) == -1) {
            result += "L4-Bc/Ha Verstoß: IMPLEMENTS zwischen unzulässigen Typen (" +
                src.Stereotype + " -> " + tgt.Stereotype + ").\n";
        }
        // Pfeilspitze muss auf den Referenzprozessschritt zeigen -> hier nur strukturell prüfbar,
        // inhaltliche Korrektheit (welches Element der "Referenzprozess" ist) bleibt manuell zu prüfen.
    }
    return result;
}