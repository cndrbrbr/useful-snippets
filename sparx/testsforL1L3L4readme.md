# ADMBw Modellvalidierung – SPARX Enterprise Architect
## Datei: `ADMBw_Validation_L1_L3_L4.js`

Grundlage:
- Dokumentation „Verwendung des ADMBw im SPARX EA" V2.0 (Mai 2024)
- Leitfaden „Architekturen für FFFmLV" V2.0 (April 2026)

---

## Einbindung in SPARX EA

1. EA öffnen
2. `Settings` → `Model Validation Configuration`
3. Tab `Scripts` → `Add Script`
4. Inhalt der `.js`-Datei einfügen und speichern
5. Validierung starten: `Construct` → `Validate` → `Validate Package`
6. Ergebnisse im Fenster `System Output` → Tab `Model Validation`
7. Doppelklick auf Fehlermeldung springt zum betroffenen Element

---

## Enthaltene Tests nach Viewpoint

---

### L1 – Node Types

| ID | Funktion | Prüft |
|----|----------|-------|
| L1-MK02 | `OnDiagram_L1_Namenskonvention` | Diagrammname entspricht Schema `L1 : Projektkürzel : Node Types` |
| L1-MK03 | `OnElement_L1_PerformerName` | OperationalPerformer hat aussagekräftigen Namen und Notes-Eintrag |
| L1-MK04 | `OnElement_L1_TaxonomieEinordnung` | OperationalPerformer ist per PropertySetGeneralisation in Taxonomie eingeordnet |
| L1-MK04 | `OnElement_L1_NeuesPerfomerFinding` | Neu angelegte Performer (nicht im Katalog) werden als Hinweis markiert (FINDING-Pflicht) |
| L1-MK05 | `OnElement_L1_AbstractionLevel` | TaggedValue `abstractionLevel` ist gesetzt |
| L1 Zusatz | `OnConnector_L1_GeneralisierungRichtung` | PropertySetGeneralisation verbindet nur OperationalPerformer; Pfeilrichtung korrekt |

---

### L3 – Node Interaction

| ID | Funktion | Prüft |
|----|----------|-------|
| L3-MK02 | `OnDiagram_L3_Namenskonvention` | Diagrammname entspricht Schema `L3 : Projektkürzel : Node Interaction` |
| L3-MK03 | `OnElement_L3_ArchitekturName` | OperationalArchitecture hat aussagekräftigen Namen |
| L3-MK04 | `OnElement_L3_ArchitekturHatRoles` | OperationalArchitecture enthält mindestens eine OperationalRole |
| L3-MK05 | `OnConnector_L3_ExchangeZwischenRoles` | OperationalExchange verbindet nur OperationalRoles; Pfeilspitze auf empfangende Role |
| L3-MK06 | `OnConnector_L3_ExchangeHatConveyedItem` | Jeder OperationalExchange trägt mindestens ein ExchangeItem/InformationElement |
| L3 Zusatz | `OnElement_L3_RoleHatExchange` | OperationalRole ohne jeglichen Exchange → Hinweis auf fehlende Austauschbeziehung |

---

### L4 – Logical Activities

| ID | Funktion | Prüft |
|----|----------|-------|
| L4-MK02 | `OnDiagram_L4_Namenskonvention` | Diagrammname entspricht Schema `L4 : Projektkürzel : Beschreibung` |
| L4-MK06 | `OnElement_L4_AbstractionLevel` | TaggedValue `abstractionLevel` bei OperationalActivity und OperationalActivityAction gesetzt |
| L4-MK09 | `OnElement_L4_PoolsLanesTypisiert` | Alle Pools und Lanes sind typisiert (Classifier zugewiesen) |
| L4-MK10 | `OnElement_L4_PoolPerformsInContext` | Pool hat PerformsInContext-Relation zu einer OperationalArchitecture |
| L4-MK11/12 | `OnElement_L4_ActionInLaneOderPool` | Aktionen, Start-/EndEvents, Gateways liegen innerhalb von Lane oder Pool |
| L4-MK13 | `OnElement_L4_TypeTag` | TaggedValue `type` bei allen Prozesselementen gesetzt und eingeblendet |
| L4-MK14 | `OnElement_L4_ActionBehaviorTyp` | OperationalActivityAction hat Behavior-Typisierung (OperationalActivity) und aussagekräftigen Namen |
| L4-MK15 | `OnElement_L4_GatewayZwang` | Mehr als 1 ausgehender Flow von einer Action → Gateway ist Pflicht |
| L4-MK16 | `OnElement_L4_PoolVollstaendig` | Jeder Pool enthält mind. StartEvent + OperationalActivityAction + EndEvent |
| L4-MK17 | `OnElement_L4_ActionConveyedItems` | Jede Action hat eingehenden Trigger und ausgehende Ergebnis-ConveyedItems am Flow |
| L4-MK18 | `OnElement_L4_IntermediateEventBedingung` | Flows mit Bedingungshinweis im Namen → IntermediateEvent prüfen |
| L4-MK19 | `OnElement_L4_ImplementsReferenz` | Actions die Referenzprozessschritte umsetzen müssen IMPLEMENTS-Relation haben |
| L4-MK20 | `OnConnector_L4_MessageFlowZwischenPools` | Pool-übergreifende Flows nur als OperationalMessageFlow (nicht ControlFlow) |
| L4-G | `OnElement_L4_ActionVerbunden` | Jede Action ist über mindestens einen ControlFlow oder ObjectFlow verbunden |
| L4-F | `OnElement_L4_GatewayVerbindungen` | Gateway hat mindestens einen eingehenden und einen ausgehenden Flow |
| L4-J/K | `OnElement_L4_RoleZuordnung` | OperationalRole ist entweder in Lane oder per PerformsInContext einer Action zugeordnet |
| L4-Bc/Ha | `OnConnector_L4_ImplementsTypen` | IMPLEMENTS verbindet nur gültige Aktivitäts-Stereotype; Pfeilrichtung beachten |

---

## Hinweise zur Anpassung

- **Stereotype-Namen** (`OperationalActivityAction`, `OperationalExchange` etc.) können je nach
  installiertem ADMBw-MDG-Profil abweichen (z. B. mit Namespace-Präfix wie `UAFP::`).
  Zur Überprüfung: EA Scripting-Konsole → `Session.Output(Repository.GetElementByID(ID).Stereotype)`

- **ConveyedItems** werden in EA intern als `EmbeddedElements` am Connector gehalten.
  Falls das MDG-Profil eine andere Struktur verwendet, muss `HasConveyedItem()` angepasst werden.

- **SQL-Abfragen** (`Repository.SQLQuery`) sind read-only und können bei sehr großen Modellen
  die Performance beeinflussen. Validierung ggf. auf einzelne Packages beschränken.

- **Hinweis-Meldungen** (kein harter Fehler, nur `[...] Hinweis:`) sollten manuell geprüft und
  nicht automatisch als Verstoß gewertet werden.

- Tests die **semantisch** nicht automatisch prüfbar sind (z. B. korrekte Pfeilrichtung bei
  IMPLEMENTS inhaltlich, Auswahl des richtigen Referenzprozesses) bleiben manueller Review
  vorbehalten.

---

## Gesamtanzahl Tests

| Viewpoint | Anzahl Prüfungen |
|-----------|-----------------|
| L1 – Node Types | 6 |
| L3 – Node Interaction | 6 |
| L4 – Logical Activities | 16 |
| **Gesamt** | **28** |
